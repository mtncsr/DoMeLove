import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { useProject } from '../contexts/ProjectContext';

export function ProfilePage() {
  const { projects, setCurrentProject, deleteProject, exportProject, importProject } = useProject();
  const navigate = useNavigate();

  const handleEdit = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setCurrentProject(project);
    navigate('/editor');
  };

  const handleExport = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const json = exportProject(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          const result = importProject(jsonData);
          if (result.success && result.project) {
            alert('Project imported successfully.');
          } else {
            alert(`Import failed: ${result.error || 'Unknown error'}`);
          }
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <section className="glass rounded-2xl p-6 border border-white/60 shadow-md">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Profile</h1>
          <p className="text-slate-700">Manage your plan and projects.</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 font-semibold">Current plan: Free</span>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
              Projects: {projects.length}
            </span>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Your Projects</h2>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleImport}>
                Import project
              </Button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="glass rounded-2xl p-6 border border-white/60 text-slate-700">
              No projects yet. Create one from the homepage.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="glass rounded-2xl p-5 border border-white/60 shadow-sm flex flex-col gap-3"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{project.name}</h3>
                    <p className="text-sm text-slate-600">Template: {project.templateId}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleEdit(project.id)} className="px-3 py-2 text-sm">
                      Edit in editor
                    </Button>
                    <Button variant="secondary" onClick={() => handleExport(project.id)} className="px-3 py-2 text-sm">
                      Export JSON
                    </Button>
                    <Button variant="danger" onClick={() => deleteProject(project.id)} className="px-3 py-2 text-sm">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}


