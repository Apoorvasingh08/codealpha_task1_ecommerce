const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Project } = require('../models');

// Initial seed project for Kanban board
const SEED_PROJECTS = [
  {
    name: 'CodeAlpha Web App Redesign',
    description: 'Complete redesign and development of the core CodeAlpha web portal, incorporating new branding, dark mode, and improved UX.',
    members: ['john_doe', 'alice_designer', 'bob_dev'],
    columns: [
      {
        id: 'todo',
        title: 'To Do',
        tasks: [
          {
            _id: 'task_1',
            title: 'Design UI mockup for login page',
            description: 'Create high-fidelity Figma mockups for the updated login and registration forms including social logins.',
            priority: 'High',
            dueDate: '2026-07-02',
            assignee: 'alice_designer',
            comments: [
              {
                userId: 'seed_user_2',
                username: 'tech_traveler',
                text: 'Make sure to include active states for buttons.',
                createdAt: new Date(Date.now() - 86400000)
              }
            ]
          },
          {
            _id: 'task_2',
            title: 'Write project documentation schema',
            description: 'Draft the data model schemas and API route outlines in Markdown for team review.',
            priority: 'Medium',
            dueDate: '2026-07-05',
            assignee: 'john_doe',
            comments: []
          }
        ]
      },
      {
        id: 'inprogress',
        title: 'In Progress',
        tasks: [
          {
            _id: 'task_3',
            title: 'Set up Express.js backend boilerplates',
            description: 'Initialize package.json, configure middleware (CORS, body parser), and set up routing skeletons.',
            priority: 'High',
            dueDate: '2026-06-29',
            assignee: 'bob_dev',
            comments: [
              {
                userId: 'seed_user_3',
                username: 'code_hustler',
                text: 'Do we use express-validator for sanitizing inputs?',
                createdAt: new Date(Date.now() - 3600000)
              }
            ]
          }
        ]
      },
      {
        id: 'review',
        title: 'In Review',
        tasks: [
          {
            _id: 'task_4',
            title: 'Tailwind CSS color theme configuration',
            description: 'Create custom extensions in tailwind.config for glassmorphism panels, including radial background gradients.',
            priority: 'Medium',
            dueDate: '2026-06-28',
            assignee: 'alice_designer',
            comments: []
          }
        ]
      },
      {
        id: 'done',
        title: 'Completed',
        tasks: [
          {
            _id: 'task_5',
            title: 'Requirement gathering & wireframing',
            description: 'Align on deliverables with CodeAlpha program managers and document the initial wireframes.',
            priority: 'Low',
            dueDate: '2026-06-20',
            assignee: 'john_doe',
            comments: []
          }
        ]
      }
    ]
  }
];

// Helper to seed projects if empty
async function ensureProjectsSeeded() {
  const count = await Project.find({});
  if (count.length === 0) {
    console.log('🌱 Seeding projects to database...');
    for (const proj of SEED_PROJECTS) {
      await Project.create(proj);
    }
  }
}

// @route   GET api/projects
// @desc    Get all projects
router.get('/', auth, async (req, res) => {
  try {
    await ensureProjectsSeeded();
    const projects = await Project.find({});
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// @route   POST api/projects
// @desc    Create a new project
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  try {
    const newProject = await Project.create({
      name,
      description: description || '',
      members: [req.user.username],
      columns: [
        { id: 'todo', title: 'To Do', tasks: [] },
        { id: 'inprogress', title: 'In Progress', tasks: [] },
        { id: 'review', title: 'In Review', tasks: [] },
        { id: 'done', title: 'Completed', tasks: [] }
      ]
    });

    res.status(201).json(newProject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

// @route   POST api/projects/:id/columns/:columnId/tasks
// @desc    Create a new task inside a column
router.post('/:id/columns/:columnId/tasks', auth, async (req, res) => {
  const { title, description, priority, dueDate, assignee } = req.body;
  const { id, columnId } = req.params;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const newTask = {
      _id: Math.random().toString(36).substring(2, 11),
      title,
      description: description || '',
      priority: priority || 'Medium',
      dueDate: dueDate || '',
      assignee: assignee || '',
      comments: []
    };

    // Find target column
    const columns = project.columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          tasks: [...(col.tasks || []), newTask]
        };
      }
      return col;
    });

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: { columns } },
      { new: true }
    );

    res.status(201).json({ project: updatedProject, task: newTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// @route   PUT api/projects/:id/tasks/:taskId/move
// @desc    Move a task from source column to destination column
router.put('/:id/tasks/:taskId/move', auth, async (req, res) => {
  const { sourceColId, destColId, index } = req.body; // index in destination column
  const { id, taskId } = req.params;

  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let taskToMove = null;

    // Find and remove task from source column
    let columns = project.columns.map(col => {
      if (col.id === sourceColId) {
        const found = col.tasks.find(t => t._id === taskId);
        if (found) taskToMove = found;
        return {
          ...col,
          tasks: col.tasks.filter(t => t._id !== taskId)
        };
      }
      return col;
    });

    if (!taskToMove) {
      return res.status(404).json({ message: 'Task not found in source column' });
    }

    // Insert task into destination column at target index
    columns = columns.map(col => {
      if (col.id === destColId) {
        const newTasks = [...col.tasks];
        const targetIndex = typeof index === 'number' ? index : newTasks.length;
        newTasks.splice(targetIndex, 0, taskToMove);
        return {
          ...col,
          tasks: newTasks
        };
      }
      return col;
    });

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: { columns } },
      { new: true }
    );

    res.json(updatedProject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error moving task' });
  }
});

// @route   PUT api/projects/:id/tasks/:taskId
// @desc    Update task details (assignee, priority, description, title, etc.)
router.put('/:id/tasks/:taskId', auth, async (req, res) => {
  const { title, description, priority, dueDate, assignee } = req.body;
  const { id, taskId } = req.params;

  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let updatedTask = null;

    const columns = project.columns.map(col => {
      const taskIndex = col.tasks.findIndex(t => t._id === taskId);
      if (taskIndex >= 0) {
        updatedTask = {
          ...col.tasks[taskIndex],
          title: title !== undefined ? title : col.tasks[taskIndex].title,
          description: description !== undefined ? description : col.tasks[taskIndex].description,
          priority: priority !== undefined ? priority : col.tasks[taskIndex].priority,
          dueDate: dueDate !== undefined ? dueDate : col.tasks[taskIndex].dueDate,
          assignee: assignee !== undefined ? assignee : col.tasks[taskIndex].assignee
        };
        const newTasks = [...col.tasks];
        newTasks[taskIndex] = updatedTask;
        return { ...col, tasks: newTasks };
      }
      return col;
    });

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: { columns } },
      { new: true }
    );

    res.json({ project: updatedProject, task: updatedTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// @route   POST api/projects/:id/tasks/:taskId/comments
// @desc    Add comment to a task
router.post('/:id/tasks/:taskId/comments', auth, async (req, res) => {
  const { text } = req.body;
  const { id, taskId } = req.params;

  if (!text) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const newComment = {
      userId: req.user.id,
      username: req.user.username,
      text,
      createdAt: new Date().toISOString()
    };

    let updatedTask = null;

    const columns = project.columns.map(col => {
      const taskIndex = col.tasks.findIndex(t => t._id === taskId);
      if (taskIndex >= 0) {
        const targetTask = col.tasks[taskIndex];
        updatedTask = {
          ...targetTask,
          comments: [...(targetTask.comments || []), newComment]
        };
        const newTasks = [...col.tasks];
        newTasks[taskIndex] = updatedTask;
        return { ...col, tasks: newTasks };
      }
      return col;
    });

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: { columns } },
      { new: true }
    );

    res.status(201).json({ project: updatedProject, task: updatedTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding task comment' });
  }
});

module.exports = router;
