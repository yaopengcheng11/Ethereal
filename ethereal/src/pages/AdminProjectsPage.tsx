import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../data/projects';
import { UsersTab } from './AdminUsersTab';
import { ProjectsListTab } from './AdminProjectsPage.list';
import ProjectFormTab from './AdminProjectsPage.form';
import { TagsTab } from './AdminTagsTab';

type Tab = 'users' | 'projects' | 'tags' | 'new';

export default function AdminProjectsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const tabs: { key: Tab; label: string; adminOnly?: boolean }[] = [
    { key: 'users', label: 'Users' },
    { key: 'projects', label: 'Projects' },
    { key: 'tags', label: 'Tags', adminOnly: true },
    { key: 'new', label: '+ New Project', adminOnly: true },
  ];

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setActiveTab('new');
  };

  const handleSaved = () => {
    setEditingProject(null);
    setActiveTab('projects');
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === 'new' && activeTab === 'new') {
      // 点击同一个 tab 时不做任何事
    }
    if (tab !== 'new') {
      setEditingProject(null);
    }
    setActiveTab(tab);
  };

  const role = currentUser?.permissions?.[0] || '';

  return (
    <div className="flex flex-col min-h-[80vh] w-full px-4 pt-24 pb-16">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-white tracking-[0.2em] uppercase">Admin Panel</h1>
          {currentUser && (
            <p className="mt-1 font-mono text-[10px] text-zinc-500 tracking-[0.1em]">
              {currentUser.email} · {currentUser.permissions.map(p => ({ super_admin: '超级管理员', admin: '管理员', guest: '访客' })[p] || p).join(', ')}
            </p>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-white/10 mb-10">
          {tabs
            .filter(t => !t.adminOnly || role === 'super_admin' || role === 'admin')
            .map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-all border-b-2 -mb-[1px] ${
                  activeTab === tab.key
                    ? 'text-white border-white'
                    : 'text-zinc-500 border-transparent hover:text-white hover:border-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && <UsersTab currentUser={currentUser} />}
        {activeTab === 'projects' && <ProjectsListTab onEdit={handleEdit} />}
        {activeTab === 'tags' && <TagsTab />}
        {activeTab === 'new' && (
          <ProjectFormTab editProject={editingProject} onSaved={handleSaved} />
        )}
      </div>
    </div>
  );
}
