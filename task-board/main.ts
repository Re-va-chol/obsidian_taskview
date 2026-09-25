import {
  App,
  ItemView,
  Menu,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
  normalizePath,
} from 'obsidian';

export const VIEW_TYPE_TASK_BOARD = 'task-board-view';
export const VIEW_TYPE_MEMO = 'task-board-memo-view';
export const VIEW_TYPE_STATS = 'task-board-stats-view';

interface TaskPropertyDef {
  id: string;
  name: string;
  color: string;
}

interface TaskMetricDef {
  id: string;
  name: string;
}

interface TaskLog {
  id: string;
  content: string;
  editedAt: number;
}

interface Task {
  id: string;
  title: string;
  propertyId: string;
  tags: string[];
  metrics: Record<string, boolean>;
  logs: TaskLog[];
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  visibleOnBoard: boolean;
  backgroundImagePath?: string;
}

interface MemoNote {
  id: string;
  order: number;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface MemoTopic {
  id: string;
  order: number;
  title: string;
  pinned: boolean;
  notes: MemoNote[];
  createdAt: number;
  updatedAt: number;
}

interface TaskBoardSettings {
  columns: number;
  rows: number;
  cardLogCount: number;
  cardGap: number;
  backgroundOpacity: number;
  backgroundOverlay: number;
  backgroundBlur: number;
  properties: TaskPropertyDef[];
  tags: string[];
  metrics: TaskMetricDef[];
  statsColumns: string[];
}

interface StoredData {
  tasks: Task[];
  settings: TaskBoardSettings;
  memoTopics: MemoTopic[];
}

const DEFAULT_PROPERTIES: TaskPropertyDef[] = [
  { id: 'work', name: '工作', color: '#3b82f6' },
  { id: 'study', name: '学习', color: '#22c55e' },
  { id: 'personal', name: '个人', color: '#f59e0b' },
  { id: 'project', name: '项目', color: '#a855f7' },
  { id: 'other', name: '其他', color: '#64748b' },
];

const DEFAULT_SETTINGS: TaskBoardSettings = {
  columns: 3,
  rows: 3,
  cardLogCount: 3,
  cardGap: 12,
  backgroundOpacity: 22,
  backgroundOverlay: 24,
  backgroundBlur: 0,
  properties: DEFAULT_PROPERTIES,
  tags: ['重要', '紧急', '长期', '工作日常'],
  metrics: [
    { id: 'first-edit', name: '已完成初步修改' },
    { id: 'submitted', name: '已经提交修改' },
  ],
  statsColumns: ['completed', 'logCount', 'first-edit', 'submitted'],
};

function cloneDefaults(): TaskBoardSettings {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as TaskBoardSettings;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function shortDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function safePositiveInt(value: number, fallback: number, min = 1, max = 12): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

function normalizeSettings(raw: Partial<TaskBoardSettings> | null | undefined): TaskBoardSettings {
  const defaults = cloneDefaults();
  const settings = raw ?? {};

  const rawProperties = Array.isArray(settings.properties) ? settings.properties : defaults.properties;
  const properties = rawProperties
    .map((property, index) => ({
      id: String(property?.id ?? `property-${index + 1}`),
      name: String(property?.name ?? '').trim() || `属性 ${index + 1}`,
      color: String(property?.color ?? '#64748b'),
    }))
    .filter((property) => property.name);

  return {
    columns: safePositiveInt(Number(settings.columns), defaults.columns, 1, 8),
    rows: safePositiveInt(Number(settings.rows), defaults.rows, 1, 8),
    cardLogCount: safePositiveInt(Number(settings.cardLogCount), defaults.cardLogCount, 0, 10),
    cardGap: safePositiveInt(Number(settings.cardGap), defaults.cardGap, 4, 24),
    backgroundOpacity: safePositiveInt(Number(settings.backgroundOpacity), defaults.backgroundOpacity, 0, 100),
    backgroundOverlay: safePositiveInt(Number(settings.backgroundOverlay), defaults.backgroundOverlay, 0, 85),
    backgroundBlur: safePositiveInt(Number(settings.backgroundBlur), defaults.backgroundBlur, 0, 12),
    properties: properties.length > 0 ? properties : defaults.properties,
    tags: uniqueStrings(settings.tags).length > 0 ? uniqueStrings(settings.tags) : defaults.tags,
    metrics: Array.isArray(settings.metrics)
      ? settings.metrics
          .map((metric, index) => ({
            id: String(metric?.id ?? `metric-${index + 1}`),
            name: String(metric?.name ?? '').trim() || `指标 ${index + 1}`,
          }))
          .filter((metric) => metric.name)
      : defaults.metrics,
    statsColumns: uniqueStrings(settings.statsColumns),
  };
}

function createDemoTasks(settings: TaskBoardSettings): Task[] {
  const now = Date.now();
  const minutes = (n: number) => now - n * 60_000;
  const propertyId = (id: string) => settings.properties.some((p) => p.id === id) ? id : settings.properties[0].id;

  const demo = [
    ['完成 SQL 数据提取', 'work', ['重要'], '完成申请、合同、贷款表关联。'],
    ['复习 TypeScript', 'study', ['长期'], '复习 interface、type 和泛型。'],
    ['整理 Obsidian 插件需求', 'project', ['重要'], '完成 3×3 卡片布局设计。'],
    ['跑步 30 分钟', 'personal', ['日常'], '今天完成 5 公里。'],
    ['设计任务卡片', 'project', ['长期'], '增加任务类型颜色。'],
    ['整理本周工作', 'work', ['工作日常'], '整理本周重点事项。'],
    ['阅读技术文档', 'study', ['长期'], '阅读 Obsidian ItemView 文档。'],
    ['购买生活用品', 'personal', [], ''],
    ['剩余任务示例 1', 'other', ['紧急'], ''],
    ['剩余任务示例 2', 'other', [], ''],
  ];

  const boardCapacity = Math.max(0, settings.columns * settings.rows - 1);

  return demo.map(([title, oldProperty, tags, log], index) => {
    const createdAt = minutes(480 - index * 20);
    const updatedAt = minutes(20 + index * 10);
    const metrics: Record<string, boolean> = {};
    settings.metrics.forEach((metric, metricIndex) => {
      metrics[metric.id] = index < 2 && metricIndex === 0;
    });

    const logs: TaskLog[] = log
      ? [{ id: createId('log'), content: log as string, editedAt: updatedAt }]
      : [];

    return {
      id: createId('task'),
      title: title as string,
      propertyId: propertyId(oldProperty as string),
      tags: uniqueStrings(tags),
      metrics,
      logs,
      createdAt,
      updatedAt,
      completed: false,
      visibleOnBoard: index < boardCapacity,
    };
  });
}

function getProperty(settings: TaskBoardSettings, propertyId: string): TaskPropertyDef {
  return settings.properties.find((property) => property.id === propertyId) ?? settings.properties[0] ?? {
    id: 'other',
    name: '其他',
    color: '#64748b',
  };
}

export default class TaskBoardPlugin extends Plugin {
  data: StoredData = {
    tasks: [],
    settings: cloneDefaults(),
    memoTopics: [],
  };

  async onload(): Promise<void> {
    await this.loadPluginData();

    this.registerView(VIEW_TYPE_TASK_BOARD, (leaf) => new TaskBoardView(leaf, this));
    this.registerView(VIEW_TYPE_MEMO, (leaf) => new MemoView(leaf, this));
    this.registerView(VIEW_TYPE_STATS, (leaf) => new StatsView(leaf, this));

    this.addSettingTab(new TaskBoardSettingTab(this.app, this));

    this.addRibbonIcon('layout-dashboard', '打开任务看板', () => void this.activateView(VIEW_TYPE_TASK_BOARD));
    this.addRibbonIcon('notebook-pen', '打开备忘录', () => void this.activateView(VIEW_TYPE_MEMO));
    this.addRibbonIcon('table-properties', '打开任务统计', () => void this.activateView(VIEW_TYPE_STATS));

    this.addCommand({
      id: 'open-task-board',
      name: '打开任务看板',
      callback: () => void this.activateView(VIEW_TYPE_TASK_BOARD),
    });
    this.addCommand({
      id: 'open-memo',
      name: '打开备忘录',
      callback: () => void this.activateView(VIEW_TYPE_MEMO),
    });
    this.addCommand({
      id: 'open-stats',
      name: '打开任务统计',
      callback: () => void this.activateView(VIEW_TYPE_STATS),
    });
    this.addCommand({
      id: 'create-task',
      name: '新建任务',
      callback: () => void this.createAndOpenTask(),
    });
  }

  async loadPluginData(): Promise<void> {
    const raw = await this.loadData() as Partial<StoredData> | null;
    const settings = normalizeSettings(raw?.settings);
    const rawTasks = Array.isArray(raw?.tasks) ? raw.tasks : [];
    const boardCapacity = Math.max(0, settings.columns * settings.rows - 1);

    let tasks: Task[];
    if (rawTasks.length === 0) {
      tasks = createDemoTasks(settings);
    } else {
      tasks = rawTasks.map((rawTask: any, index) => {
        const oldType = String(rawTask.propertyId ?? rawTask.type ?? settings.properties[0]?.id ?? 'other');
        const propertyId = settings.properties.some((p) => p.id === oldType)
          ? oldType
          : settings.properties[0]?.id ?? 'other';
        const metrics: Record<string, boolean> = {};
        const oldMetrics = rawTask.metrics && typeof rawTask.metrics === 'object' ? rawTask.metrics : {};
        settings.metrics.forEach((metric) => {
          metrics[metric.id] = Boolean(oldMetrics[metric.id]);
        });

        return {
          id: String(rawTask.id ?? createId('task')),
          title: String(rawTask.title ?? '未命名任务'),
          propertyId,
          tags: uniqueStrings(rawTask.tags),
          metrics,
          logs: Array.isArray(rawTask.logs)
            ? rawTask.logs.map((log: any) => ({
                id: String(log.id ?? createId('log')),
                content: String(log.content ?? ''),
                editedAt: Number(log.editedAt ?? Date.now()),
              }))
            : [],
          createdAt: Number(rawTask.createdAt ?? Date.now()),
          updatedAt: Number(rawTask.updatedAt ?? Date.now()),
          completed: Boolean(rawTask.completed),
          visibleOnBoard: typeof rawTask.visibleOnBoard === 'boolean'
            ? rawTask.visibleOnBoard
            : index < boardCapacity,
          backgroundImagePath: typeof rawTask.backgroundImagePath === 'string' && rawTask.backgroundImagePath.trim()
            ? rawTask.backgroundImagePath
            : undefined,
        };
      });
    }

    const memoTopics = Array.isArray(raw?.memoTopics)
      ? raw.memoTopics.map((topic: any, topicIndex: number) => ({
          id: String(topic.id ?? createId('topic')),
          order: Number.isFinite(Number(topic.order)) ? Number(topic.order) : topicIndex,
          title: String(topic.title ?? '未命名主题'),
          pinned: Boolean(topic.pinned),
          createdAt: Number(topic.createdAt ?? Date.now()),
          updatedAt: Number(topic.updatedAt ?? Date.now()),
          notes: Array.isArray(topic.notes)
            ? topic.notes.map((note: any, noteIndex: number) => ({
                id: String(note.id ?? createId('note')),
                order: Number.isFinite(Number(note.order)) ? Number(note.order) : noteIndex,
                content: String(note.content ?? ''),
                createdAt: Number(note.createdAt ?? Date.now()),
                updatedAt: Number(note.updatedAt ?? Date.now()),
              }))
                .sort((a: MemoNote, b: MemoNote) => a.order - b.order)
                .map((note: MemoNote, index: number) => ({ ...note, order: index }))
            : [],
        }))
        .sort((a: MemoTopic, b: MemoTopic) => a.order - b.order)
        .map((topic: MemoTopic, index: number) => ({ ...topic, order: index }))
      : [];

    this.data = { tasks, settings, memoTopics };

    const requiredStats = ['completed', 'logCount'];
    for (const stat of requiredStats) {
      if (!this.data.settings.statsColumns.includes(stat)) {
        this.data.settings.statsColumns.push(stat);
      }
    }

    await this.savePluginData();
  }

  async savePluginData(): Promise<void> {
    await this.saveData(this.data);
  }

  async activateView(viewType: string): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(viewType)[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return;
    }

    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({ type: viewType, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  getTask(taskId: string): Task | undefined {
    return this.data.tasks.find((task) => task.id === taskId);
  }

  async createTask(title = '新任务'): Promise<Task> {
    const now = Date.now();
    const metrics: Record<string, boolean> = {};
    this.data.settings.metrics.forEach((metric) => { metrics[metric.id] = false; });

    const task: Task = {
      id: createId('task'),
      title,
      propertyId: this.data.settings.properties[0]?.id ?? 'other',
      tags: [],
      metrics,
      logs: [],
      createdAt: now,
      updatedAt: now,
      completed: false,
      visibleOnBoard: true,
      backgroundImagePath: undefined,
    };

    this.data.tasks.unshift(task);
    await this.savePluginData();
    this.refreshViews();
    return task;
  }

  async createAndOpenTask(): Promise<void> {
    const task = await this.createTask();
    new TaskModal(this.app, this, task.id).open();
  }

  async deleteTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId);
    if (task?.backgroundImagePath) await this.deleteBackgroundFile(task.backgroundImagePath);
    this.data.tasks = this.data.tasks.filter((item) => item.id !== taskId);
    await this.savePluginData();
    this.refreshViews();
    new Notice('任务已删除');
  }

  async saveTask(task: Task): Promise<void> {
    task.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshViews();
  }

  private async ensureVaultFolder(path: string): Promise<void> {
    const parts = normalizePath(path).split('/').filter(Boolean);
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  private async deleteBackgroundFile(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(normalizePath(path));
    if (file instanceof TFile) {
      try {
        await this.app.vault.delete(file);
      } catch {
        // Ignore a missing/unavailable background file.
      }
    }
  }

  async setTaskBackground(taskId: string, file: File): Promise<void> {
    const task = this.getTask(taskId);
    if (!task) return;
    if (!file.type.startsWith('image/')) {
      new Notice('请选择图片文件。');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      new Notice('图片不能超过 10 MB。建议使用压缩后的 JPG/PNG。');
      return;
    }

    const folder = 'Task Board/Backgrounds';
    await this.ensureVaultFolder(folder);
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'background-image';
    const path = normalizePath(`${folder}/${task.id}-${Date.now()}-${cleanName}`);
    await this.app.vault.createBinary(path, await file.arrayBuffer());

    const oldPath = task.backgroundImagePath;
    task.backgroundImagePath = path;
    await this.savePluginData();
    if (oldPath && oldPath !== path) await this.deleteBackgroundFile(oldPath);
    this.refreshViews();
  }

  async clearTaskBackground(taskId: string): Promise<void> {
    const task = this.getTask(taskId);
    if (!task) return;
    const oldPath = task.backgroundImagePath;
    task.backgroundImagePath = undefined;
    await this.savePluginData();
    if (oldPath) await this.deleteBackgroundFile(oldPath);
    this.refreshViews();
  }

  getTaskBackgroundUrl(task: Task): string | null {
    if (!task.backgroundImagePath) return null;
    const file = this.app.vault.getAbstractFileByPath(normalizePath(task.backgroundImagePath));
    return file instanceof TFile ? this.app.vault.getResourcePath(file) : null;
  }

  async reorderVisibleTasks(draggedId: string, targetId: string): Promise<void> {
    if (draggedId === targetId) return;
    const visibleIndexes = this.data.tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => task.visibleOnBoard)
      .map(({ index }) => index);
    const draggedIndexInVisible = visibleIndexes.findIndex((index) => this.data.tasks[index].id === draggedId);
    const targetIndexInVisible = visibleIndexes.findIndex((index) => this.data.tasks[index].id === targetId);
    if (draggedIndexInVisible < 0 || targetIndexInVisible < 0) return;

    const visibleTasks = visibleIndexes.map((index) => this.data.tasks[index]);
    const [dragged] = visibleTasks.splice(draggedIndexInVisible, 1);
    visibleTasks.splice(targetIndexInVisible, 0, dragged);
    visibleIndexes.forEach((index, position) => {
      this.data.tasks[index] = visibleTasks[position];
    });
    await this.savePluginData();
    this.refreshViews();
  }

  async reorderMemoTopics(draggedId: string, targetId: string): Promise<void> {
    if (draggedId === targetId) return;
    const dragged = this.data.memoTopics.find((topic) => topic.id === draggedId);
    const target = this.data.memoTopics.find((topic) => topic.id === targetId);
    if (!dragged || !target || dragged.pinned !== target.pinned) return;

    const group = this.data.memoTopics
      .filter((topic) => topic.pinned === dragged.pinned)
      .sort((a, b) => a.order - b.order);
    const from = group.findIndex((topic) => topic.id === draggedId);
    const to = group.findIndex((topic) => topic.id === targetId);
    if (from < 0 || to < 0) return;

    const [item] = group.splice(from, 1);
    group.splice(to, 0, item);
    group.forEach((topic, index) => { topic.order = index; });

    const pinnedGroup = this.data.memoTopics.filter((topic) => topic.pinned).sort((a, b) => a.order - b.order);
    const unpinnedGroup = this.data.memoTopics.filter((topic) => !topic.pinned).sort((a, b) => a.order - b.order);
    let order = 0;
    [...pinnedGroup, ...unpinnedGroup].forEach((topic) => { topic.order = order++; });
    this.data.memoTopics = [...pinnedGroup, ...unpinnedGroup];

    await this.savePluginData();
    this.refreshViews();
  }

  async reorderMemoNotes(topicId: string, draggedId: string, targetId: string): Promise<void> {
    if (draggedId === targetId) return;
    const topic = this.data.memoTopics.find((item) => item.id === topicId);
    if (!topic) return;
    const from = topic.notes.findIndex((note) => note.id === draggedId);
    const to = topic.notes.findIndex((note) => note.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = topic.notes.splice(from, 1);
    topic.notes.splice(to, 0, item);
    topic.notes.forEach((note, index) => { note.order = index; });
    topic.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshViews();
  }

  refreshViews(): void {
    window.requestAnimationFrame(() => {
      for (const viewType of [VIEW_TYPE_TASK_BOARD, VIEW_TYPE_MEMO, VIEW_TYPE_STATS]) {
        for (const leaf of this.app.workspace.getLeavesOfType(viewType)) {
          const view = leaf.view as unknown as { getViewType?: () => string; render?: () => void } | null;
          if (view?.getViewType?.() === viewType && typeof view.render === 'function') {
            view.render();
          }
        }
      }
    });
  }
}

class TaskBoardSettingTab extends PluginSettingTab {
  private readonly taskBoardPlugin: TaskBoardPlugin;

  constructor(app: App, plugin: TaskBoardPlugin) {
    super(app, plugin);
    this.taskBoardPlugin = plugin;
  }

  display(): void {
    const container = this.containerEl;
    container.empty();

    container.createEl('h2', { text: 'Task Board 设置' });

    container.createEl('h3', { text: '任务界面' });

    new Setting(container)
      .setName('横向卡片数量')
      .setDesc('例如 3 表示每行 3 张卡片。')
      .addText((text) => text
        .setValue(String(this.taskBoardPlugin.data.settings.columns))
        .onChange(async (value) => {
          this.taskBoardPlugin.data.settings.columns = safePositiveInt(Number(value), 3, 1, 8);
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
        }));

    new Setting(container)
      .setName('纵向卡片数量')
      .setDesc('例如 3 表示总共 3 行。最后一格固定为“显示所有任务”。')
      .addText((text) => text
        .setValue(String(this.taskBoardPlugin.data.settings.rows))
        .onChange(async (value) => {
          this.taskBoardPlugin.data.settings.rows = safePositiveInt(Number(value), 3, 1, 8);
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
        }));

    new Setting(container)
      .setName('卡片日志条数')
      .setDesc('卡片上最多显示最近几条日志。')
      .addText((text) => text
        .setValue(String(this.taskBoardPlugin.data.settings.cardLogCount))
        .onChange(async (value) => {
          this.taskBoardPlugin.data.settings.cardLogCount = safePositiveInt(Number(value), 3, 0, 10);
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
        }));

    new Setting(container)
      .setName('卡片间距')
      .setDesc('任务卡片之间的间距，单位为像素。')
      .addText((text) => text
        .setValue(String(this.taskBoardPlugin.data.settings.cardGap))
        .onChange(async (value) => {
          this.taskBoardPlugin.data.settings.cardGap = safePositiveInt(Number(value), 12, 4, 24);
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
        }));

    container.createEl('h4', { text: '任务背景图片' });
    container.createDiv({
      text: '任务可以使用本地图片作为卡片背景。图片会复制到当前 Vault 的 “Task Board/Backgrounds” 文件夹，因此换电脑并同步 Vault 后仍然可以使用。',
      cls: 'task-board-setting-hint',
    });

    new Setting(container)
      .setName('背景图片透明度')
      .setDesc('数值越高，背景图片越明显。0 表示完全隐藏。')
      .addSlider((slider) => slider
        .setLimits(0, 100, 1)
        .setValue(this.taskBoardPlugin.data.settings.backgroundOpacity)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.taskBoardPlugin.data.settings.backgroundOpacity = value;
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
        }));

    new Setting(container)
      .setName('背景图片模糊')
      .setDesc('给背景图片增加轻微模糊，让任务文字更容易阅读。')
      .addSlider((slider) => slider
        .setLimits(0, 12, 1)
        .setValue(this.taskBoardPlugin.data.settings.backgroundBlur)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.taskBoardPlugin.data.settings.backgroundBlur = value;
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
        }));

    new Setting(container)
      .setName('背景遮罩强度')
      .setDesc('在背景图片上叠加一层半透明遮罩，提升卡片文字的可读性。')
      .addSlider((slider) => slider
        .setLimits(0, 85, 1)
        .setValue(this.taskBoardPlugin.data.settings.backgroundOverlay)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.taskBoardPlugin.data.settings.backgroundOverlay = value;
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
        }));

    container.createEl('h3', { text: '任务属性' });
    container.createDiv({
      text: '属性就是任务的主分类，例如“工作、学习、项目”。每个属性可以设置自己的颜色。',
      cls: 'task-board-setting-hint',
    });

    const propertiesContainer = container.createDiv({ cls: 'task-board-setting-list' });
    this.taskBoardPlugin.data.settings.properties.forEach((property) => {
      this.renderPropertySetting(propertiesContainer, property);
    });

    new Setting(container)
      .addButton((button) => button
        .setButtonText('＋ 添加任务属性')
        .onClick(async () => {
          this.taskBoardPlugin.data.settings.properties.push({
            id: createId('property'),
            name: '新属性',
            color: '#64748b',
          });
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
          this.display();
        }));

    container.createEl('h3', { text: '任务标签' });
    container.createDiv({
      text: '每行输入一个标签。任务编辑窗口会提供勾选框。',
      cls: 'task-board-setting-hint',
    });
    new Setting(container)
      .setName('可用标签')
      .addTextArea((text) => text
        .setPlaceholder('重要\n紧急\n长期')
        .setValue(this.taskBoardPlugin.data.settings.tags.join('\n'))
        .onChange(async (value) => {
          this.taskBoardPlugin.data.settings.tags = uniqueStrings(value.split(/[\n,，]/));
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
        }));

    container.createEl('h3', { text: '任务指标 / 统计维度' });
    container.createDiv({
      text: '这些指标会同时出现在任务卡片底部，并可以作为统计表中的列。例如“已完成初步修改”“已经提交修改”。',
      cls: 'task-board-setting-hint',
    });

    const metricsContainer = container.createDiv({ cls: 'task-board-setting-list' });
    this.taskBoardPlugin.data.settings.metrics.forEach((metric) => {
      this.renderMetricSetting(metricsContainer, metric);
    });

    new Setting(container)
      .addButton((button) => button
        .setButtonText('＋ 添加任务指标')
        .onClick(async () => {
          const id = createId('metric');
          this.taskBoardPlugin.data.settings.metrics.push({ id, name: '新指标' });
          this.taskBoardPlugin.data.settings.statsColumns.push(id);
          await this.taskBoardPlugin.savePluginData();
          this.taskBoardPlugin.refreshViews();
          this.display();
        }));

    container.createEl('h3', { text: '统计表列' });
    container.createDiv({
      text: '选择哪些维度出现在统计表中。',
      cls: 'task-board-setting-hint',
    });

    const statColumns = [
      { id: 'completed', name: '已完成' },
      { id: 'logCount', name: '日志数量' },
      { id: 'tagCount', name: '标签数量' },
      ...this.taskBoardPlugin.data.settings.metrics.map((metric) => ({ id: metric.id, name: metric.name })),
    ];

    statColumns.forEach((dimension) => {
      new Setting(container)
        .setName(dimension.name)
        .addToggle((toggle) => toggle
          .setValue(this.taskBoardPlugin.data.settings.statsColumns.includes(dimension.id))
          .onChange(async (value) => {
            if (value) {
              if (!this.taskBoardPlugin.data.settings.statsColumns.includes(dimension.id)) {
                this.taskBoardPlugin.data.settings.statsColumns.push(dimension.id);
              }
            } else {
              this.taskBoardPlugin.data.settings.statsColumns = this.taskBoardPlugin.data.settings.statsColumns.filter((id) => id !== dimension.id);
            }
            await this.taskBoardPlugin.savePluginData();
            this.taskBoardPlugin.refreshViews();
          }));
    });

    container.createEl('h3', { text: '其他' });
    new Setting(container)
      .setName('任务排序说明')
      .setDesc('任务卡片按“显示在看板”选择结果排列；剩余任务统一放在最后一格。');
  }

  private renderPropertySetting(container: HTMLElement, property: TaskPropertyDef): void {
    const row = container.createDiv({ cls: 'task-board-setting-item' });

    const nameInput = row.createEl('input', {
      type: 'text',
      value: property.name,
      cls: 'task-board-setting-inline-input',
    });

    const colorInput = row.createEl('input', {
      type: 'color',
      value: property.color,
      cls: 'task-board-setting-color',
    });

    const deleteButton = row.createEl('button', { text: '删除' });

    nameInput.addEventListener('change', () => {
      property.name = nameInput.value.trim() || '未命名属性';
      void this.taskBoardPlugin.savePluginData().then(() => this.taskBoardPlugin.refreshViews());
    });
    colorInput.addEventListener('change', () => {
      property.color = colorInput.value;
      void this.taskBoardPlugin.savePluginData().then(() => this.taskBoardPlugin.refreshViews());
    });
    deleteButton.addEventListener('click', () => {
      if (this.taskBoardPlugin.data.settings.properties.length <= 1) {
        new Notice('至少需要保留一个任务属性');
        return;
      }
      const fallbackId = this.taskBoardPlugin.data.settings.properties.find((item) => item.id !== property.id)?.id;
      this.taskBoardPlugin.data.tasks.forEach((task) => {
        if (task.propertyId === property.id && fallbackId) task.propertyId = fallbackId;
      });
      this.taskBoardPlugin.data.settings.properties = this.taskBoardPlugin.data.settings.properties.filter((item) => item.id !== property.id);
      void this.taskBoardPlugin.savePluginData().then(() => {
        this.taskBoardPlugin.refreshViews();
        this.display();
      });
    });
  }

  private renderMetricSetting(container: HTMLElement, metric: TaskMetricDef): void {
    const row = container.createDiv({ cls: 'task-board-setting-item' });
    const nameInput = row.createEl('input', {
      type: 'text',
      value: metric.name,
      cls: 'task-board-setting-inline-input',
    });
    const deleteButton = row.createEl('button', { text: '删除' });

    nameInput.addEventListener('change', () => {
      metric.name = nameInput.value.trim() || '未命名指标';
      void this.taskBoardPlugin.savePluginData().then(() => {
        this.taskBoardPlugin.refreshViews();
        this.display();
      });
    });

    deleteButton.addEventListener('click', () => {
      this.taskBoardPlugin.data.settings.metrics = this.taskBoardPlugin.data.settings.metrics.filter((item) => item.id !== metric.id);
      this.taskBoardPlugin.data.settings.statsColumns = this.taskBoardPlugin.data.settings.statsColumns.filter((id) => id !== metric.id);
      this.taskBoardPlugin.data.tasks.forEach((task) => delete task.metrics[metric.id]);
      void this.taskBoardPlugin.savePluginData().then(() => {
        this.taskBoardPlugin.refreshViews();
        this.display();
      });
    });
  }
}

class TaskBoardView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private readonly plugin: TaskBoardPlugin) {
    super(leaf);
  }

  getViewType(): string { return VIEW_TYPE_TASK_BOARD; }
  getDisplayText(): string { return '任务看板'; }
  getIcon(): string { return 'layout-dashboard'; }

  async onOpen(): Promise<void> { this.render(); }
  async onClose(): Promise<void> { this.contentEl.empty(); }

  render(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass('task-board-view');

    const { columns, rows } = this.plugin.data.settings;
    const slotCount = Math.max(1, columns * rows);
    const cardCapacity = Math.max(0, slotCount - 1);

    const header = root.createDiv({ cls: 'task-board-header' });
    const headerText = header.createDiv({ cls: 'task-board-header-text' });
    headerText.createEl('h2', { text: '任务看板', cls: 'task-board-heading' });
    headerText.createDiv({
      text: `${this.plugin.data.tasks.length} 个任务 · ${columns} × ${rows} 看板`,
      cls: 'task-board-subtitle',
    });

    const actions = header.createDiv({ cls: 'task-board-header-actions' });
    const memoButton = actions.createEl('button', { text: '备忘录', cls: 'task-board-secondary-button' });
    memoButton.addEventListener('click', () => void this.plugin.activateView(VIEW_TYPE_MEMO));

    const statsButton = actions.createEl('button', { text: '统计', cls: 'task-board-secondary-button' });
    statsButton.addEventListener('click', () => void this.plugin.activateView(VIEW_TYPE_STATS));

    const addButton = actions.createEl('button', { text: '+ 新建任务', cls: 'task-board-add-button' });
    addButton.addEventListener('click', () => void this.plugin.createAndOpenTask());

    const grid = root.createDiv({ cls: 'task-board-grid' });
    grid.style.setProperty('--task-columns', String(columns));
    grid.style.setProperty('--task-rows', String(rows));
    grid.style.setProperty('--task-gap', `${this.plugin.data.settings.cardGap}px`);

    const visibleTasks = this.plugin.data.tasks
      .filter((task) => task.visibleOnBoard)
      .slice(0, cardCapacity);

    visibleTasks.forEach((task) => this.renderTaskCard(grid, task));

    while (grid.children.length < cardCapacity) {
      grid.createDiv({ cls: 'task-board-empty-cell' });
    }

    this.renderAllTasksCard(grid, this.plugin.data.tasks);
  }

  private renderTaskCard(container: HTMLElement, task: Task): void {
    const property = getProperty(this.plugin.data.settings, task.propertyId);
    const card = container.createDiv({ cls: `task-card${task.completed ? ' is-completed' : ''}` });
    card.style.setProperty('--task-color', property.color);
    card.style.setProperty('--task-bg-opacity', String(this.plugin.data.settings.backgroundOpacity / 100));
    card.style.setProperty('--task-bg-overlay', String(this.plugin.data.settings.backgroundOverlay / 100));
    card.style.setProperty('--task-bg-blur', `${this.plugin.data.settings.backgroundBlur}px`);

    const backgroundUrl = this.plugin.getTaskBackgroundUrl(task);
    if (backgroundUrl) {
      card.style.setProperty('--task-bg-image', `url("${backgroundUrl.replace(/"/g, '\\"')}")`);
      card.addClass('has-background-image');
    }

    const content = card.createDiv({ cls: 'task-card-content' });
    const titleRow = content.createDiv({ cls: 'task-card-title-row' });
    titleRow.createDiv({ cls: 'task-card-type-dot' }).style.backgroundColor = property.color;
    titleRow.createDiv({ text: task.title, cls: 'task-card-title' });
    titleRow.createDiv({ text: property.name, cls: 'task-card-type-label' });

    if (task.tags.length > 0) {
      const tags = content.createDiv({ cls: 'task-card-tags' });
      task.tags.slice(0, 4).forEach((tag) => tags.createSpan({ text: `#${tag}`, cls: 'task-board-tag' }));
    }

    const logs = [...task.logs].sort((a, b) => b.editedAt - a.editedAt);
    const previewLogs = logs.slice(0, this.plugin.data.settings.cardLogCount);

    const logsContainer = content.createDiv({ cls: 'task-card-logs' });
    if (previewLogs.length === 0) {
      logsContainer.createDiv({ text: '还没有日志', cls: 'task-card-empty-log' });
    } else {
      previewLogs.forEach((log) => {
        const row = logsContainer.createDiv({ cls: 'task-card-log' });
        row.createDiv({ text: shortDate(log.editedAt), cls: 'task-card-log-time' });
        row.createDiv({ text: log.content, cls: 'task-card-log-content' });
      });
    }

    const metrics = this.plugin.data.settings.metrics;
    if (metrics.length > 0) {
      const metricBox = content.createDiv({ cls: 'task-card-metrics' });
      metrics.forEach((metric) => {
        const label = metricBox.createEl('label', { cls: 'task-card-metric' });
        const checkbox = label.createEl('input', { type: 'checkbox' });
        checkbox.checked = Boolean(task.metrics[metric.id]);
        label.createSpan({ text: metric.name });
        checkbox.addEventListener('click', (event) => event.stopPropagation());
        checkbox.addEventListener('change', () => {
          const current = this.plugin.getTask(task.id);
          if (!current) return;
          current.metrics[metric.id] = checkbox.checked;
          void this.plugin.saveTask(current).then(() => new Notice(`指标“${metric.name}”已更新`));
        });
      });
    }

    if (task.completed) {
      const footer = content.createDiv({ cls: 'task-card-footer task-card-footer-compact' });
      footer.createSpan({ text: '已完成', cls: 'task-card-completed-badge' });
    }

    let didDrag = false;
    card.draggable = true;
    card.addEventListener('dragstart', (event) => {
      didDrag = true;
      card.addClass('is-dragging');
      event.dataTransfer?.setData('text/task-board-task-id', task.id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      if (!card.classList.contains('is-dragging')) card.addClass('is-drag-over');
    });
    card.addEventListener('dragleave', () => card.removeClass('is-drag-over'));
    card.addEventListener('dragend', () => {
      card.removeClass('is-dragging');
      card.removeClass('is-drag-over');
    });
    card.addEventListener('drop', (event) => {
      event.preventDefault();
      card.removeClass('is-drag-over');
      const draggedId = event.dataTransfer?.getData('text/task-board-task-id');
      if (draggedId) void this.plugin.reorderVisibleTasks(draggedId, task.id);
    });
    card.addEventListener('dragend', () => {
      card.removeClass('is-dragging');
      card.removeClass('is-drag-over');
      window.setTimeout(() => { didDrag = false; }, 250);
    });
    card.addEventListener('click', () => {
      if (didDrag) return;
      new TaskModal(this.app, this.plugin, task.id).open();
    });
  }

  private renderAllTasksCard(container: HTMLElement, tasks: Task[]): void {
    const cell = container.createDiv({ cls: 'task-all-tasks-stack-cell' });
    cell.draggable = false;

    const button = cell.createEl('button', {
      text: '打开所有任务',
      cls: 'task-all-tasks-stack-button',
    });
    button.addEventListener('click', () => new AllTasksModal(this.app, this.plugin).open());

    const stack = cell.createDiv({ cls: 'task-stack-visual' });
    const previews = Math.max(5, Math.min(7, tasks.length || 5));
    const poses = [
      [-9, 4, -7],
      [7, 2, 5],
      [-3, -6, -2],
      [10, 8, 8],
      [-7, 10, 3],
      [2, 14, -6],
      [13, 17, -3],
    ];

    for (let index = 0; index < previews; index += 1) {
      const preview = stack.createDiv({ cls: 'task-stack-preview' });
      const [x, y, rotation] = poses[index % poses.length];
      preview.style.setProperty('--stack-x', `${x}px`);
      preview.style.setProperty('--stack-y', `${y}px`);
      preview.style.setProperty('--stack-rotation', `${rotation}deg`);
      preview.style.setProperty('--stack-index', String(index));
    }

    if (tasks.length === 0) {
      stack.createDiv({ cls: 'task-stack-empty' });
    }
  }
}

class TaskModal extends Modal {
  constructor(app: App, private readonly plugin: TaskBoardPlugin, private readonly taskId: string) {
    super(app);
  }

  onOpen(): void {
    this.applyBackdropBlur();
    this.modalEl.addClass('task-board-task-modal');
    this.render();
  }

  onClose(): void { this.contentEl.empty(); }

  private applyBackdropBlur(): void {
    this.modalEl.parentElement?.querySelector<HTMLElement>('.modal-bg')?.classList.add('task-board-modal-backdrop');
  }

  private render(): void {
    const task = this.plugin.getTask(this.taskId);
    const container = this.contentEl;
    container.empty();

    if (!task) {
      container.createDiv({ text: '任务不存在。' });
      return;
    }

    const property = getProperty(this.plugin.data.settings, task.propertyId);
    this.setTitle('编辑任务');

    const header = container.createDiv({ cls: 'task-modal-header' });
    header.createDiv({ text: task.title, cls: 'task-modal-title-preview' });
    header.createDiv({ text: `${property.name} · 创建于 ${formatDate(task.createdAt)}`, cls: 'task-modal-meta' });

    const editor = container.createDiv({ cls: 'task-modal-editor-v2' });
    editor.createDiv({ text: '任务名称', cls: 'task-modal-section-label' });
    const titleInput = editor.createEl('input', { type: 'text', value: task.title, cls: 'task-modal-title-input' });

    editor.createDiv({ text: '任务属性', cls: 'task-modal-section-label' });
    const propertySelect = editor.createEl('select', { cls: 'task-modal-type-select' });
    this.plugin.data.settings.properties.forEach((item) => {
      const option = propertySelect.createEl('option', { value: item.id, text: item.name });
      option.selected = item.id === task.propertyId;
    });

    const statusRow = editor.createDiv({ cls: 'task-modal-status-row' });
    this.renderToggle(statusRow, '已完成', task.completed, (value) => {
      task.completed = value;
      void this.plugin.saveTask(task).then(() => this.render());
    });
    this.renderToggle(statusRow, '显示在任务界面', task.visibleOnBoard, (value) => {
      task.visibleOnBoard = value;
      void this.plugin.saveTask(task).then(() => this.render());
    });

    editor.createDiv({ text: '任务标签', cls: 'task-modal-section-label' });
    const tagsBox = editor.createDiv({ cls: 'task-modal-tag-options' });
    this.plugin.data.settings.tags.forEach((tag) => {
      const label = tagsBox.createEl('label', { cls: 'task-modal-tag-option' });
      const checkbox = label.createEl('input', { type: 'checkbox' });
      checkbox.checked = task.tags.includes(tag);
      label.createSpan({ text: tag });
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          if (!task.tags.includes(tag)) task.tags.push(tag);
        } else {
          task.tags = task.tags.filter((item) => item !== tag);
        }
      });
    });

    const saveButton = editor.createEl('button', { text: '保存任务信息', cls: 'mod-cta task-modal-save-button' });
    saveButton.addEventListener('click', (): void => {
      task.title = titleInput.value.trim() || '未命名任务';
      task.propertyId = propertySelect.value;
      void this.plugin.saveTask(task).then(() => {
        new Notice('任务信息已保存');
        this.render();
      });
    });

    editor.createDiv({ text: '卡片背景图片', cls: 'task-modal-section-label' });
    editor.createDiv({
      text: '背景图片会保存到当前 Vault 的 Task Board/Backgrounds 文件夹。设置中的透明度、模糊和遮罩强度会应用到所有任务卡片。',
      cls: 'task-modal-section-hint',
    });

    const backgroundRow = editor.createDiv({ cls: 'task-background-row' });
    const backgroundInput = backgroundRow.createEl('input', { type: 'file', cls: 'task-background-file-input' });
    backgroundInput.accept = 'image/*';
    const chooseImageButton = backgroundRow.createEl('button', { text: task.backgroundImagePath ? '更换背景图片' : '选择本地图片', cls: 'task-modal-secondary-button' });
    chooseImageButton.addEventListener('click', () => backgroundInput.click());
    backgroundInput.addEventListener('change', () => {
      const file = backgroundInput.files?.[0];
      if (!file) return;
      void this.plugin.setTaskBackground(this.taskId, file).then(() => {
        new Notice('任务背景图片已更新');
        this.render();
      });
    });

    if (task.backgroundImagePath) {
      const url = this.plugin.getTaskBackgroundUrl(task);
      if (url) {
        const preview = editor.createDiv({ cls: 'task-background-preview' });
        preview.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;
      }
      const clearBackground = backgroundRow.createEl('button', { text: '移除背景', cls: 'task-modal-danger-link' });
      clearBackground.addEventListener('click', () => {
        void this.plugin.clearTaskBackground(this.taskId).then(() => {
          new Notice('背景图片已移除');
          this.render();
        });
      });
    }

    if (this.plugin.data.settings.metrics.length > 0) {
      const metricsHeader = container.createDiv({ cls: 'task-modal-logs-header' });
      metricsHeader.createDiv({ text: '任务指标', cls: 'task-modal-section-title' });
      metricsHeader.createDiv({ text: '这些指标同时参与统计表。', cls: 'task-modal-section-hint' });

      const metricsBox = container.createDiv({ cls: 'task-modal-metrics-grid' });
      this.plugin.data.settings.metrics.forEach((metric) => {
        const label = metricsBox.createEl('label', { cls: 'task-modal-metric-row' });
        const checkbox = label.createEl('input', { type: 'checkbox' });
        checkbox.checked = Boolean(task.metrics[metric.id]);
        label.createSpan({ text: metric.name });
        checkbox.addEventListener('change', () => {
          task.metrics[metric.id] = checkbox.checked;
          void this.plugin.saveTask(task);
        });
      });
    }

    const logsHeader = container.createDiv({ cls: 'task-modal-logs-header' });
    logsHeader.createDiv({ text: '任务日志', cls: 'task-modal-section-title' });
    logsHeader.createDiv({ text: '按最近编辑时间倒序排列', cls: 'task-modal-section-hint' });

    const logs = container.createDiv({ cls: 'task-modal-logs' });
    const sortedLogs = [...task.logs].sort((a, b) => b.editedAt - a.editedAt);
    if (sortedLogs.length === 0) {
      logs.createDiv({ text: '暂无日志。', cls: 'task-modal-empty-logs' });
    }
    sortedLogs.forEach((log) => this.renderLog(logs, log));

    const addLogBox = container.createDiv({ cls: 'task-modal-add-log' });
    addLogBox.createDiv({ text: '新增日志', cls: 'task-modal-section-label' });
    const newLogTextarea = addLogBox.createEl('textarea', {
      cls: 'task-modal-log-input',
      placeholder: '记录这次进展……',
    });
    const addLogButton = addLogBox.createEl('button', { text: '添加日志', cls: 'task-modal-secondary-button' });
    addLogButton.addEventListener('click', (): void => {
      const content = newLogTextarea.value.trim();
      if (!content) return new Notice('请先输入日志内容');
      const now = Date.now();
      const currentTask = this.plugin.getTask(this.taskId);
      if (!currentTask) return;
      currentTask.logs.push({ id: createId('log'), content, editedAt: now });
      currentTask.updatedAt = now;
      void this.plugin.saveTask(currentTask).then(() => {
        new Notice('日志已添加');
        this.render();
      });
    });

    const bottom = container.createDiv({ cls: 'task-modal-bottom-actions' });
    const deleteButton = bottom.createEl('button', { text: '删除任务', cls: 'task-modal-danger-button' });
    deleteButton.addEventListener('click', () => {
      if (!window.confirm(`确定删除“${task.title}”吗？`)) return;
      void this.plugin.deleteTask(this.taskId).then(() => this.close());
    });
  }

  private renderToggle(container: HTMLElement, text: string, value: boolean, onChange: (value: boolean) => void): void {
    const label = container.createEl('label', { cls: 'task-modal-status-toggle' });
    const checkbox = label.createEl('input', { type: 'checkbox' });
    checkbox.checked = value;
    label.createSpan({ text });
    checkbox.addEventListener('change', () => onChange(checkbox.checked));
  }

  private renderLog(container: HTMLElement, log: TaskLog): void {
    const row = container.createDiv({ cls: 'task-modal-log-row' });
    const meta = row.createDiv({ cls: 'task-modal-log-meta' });
    meta.createDiv({ text: formatDate(log.editedAt), cls: 'task-modal-log-time' });
    const textarea = row.createEl('textarea', { cls: 'task-modal-log-textarea' });
    textarea.value = log.content;

    const actions = row.createDiv({ cls: 'task-modal-log-actions' });
    const saveButton = actions.createEl('button', { text: '保存修改', cls: 'task-modal-secondary-button' });
    const deleteButton = actions.createEl('button', { text: '删除日志', cls: 'task-modal-danger-link' });

    saveButton.addEventListener('click', () => {
      const task = this.plugin.getTask(this.taskId);
      if (!task) return;
      const currentLog = task.logs.find((item) => item.id === log.id);
      if (!currentLog) return;
      const content = textarea.value.trim();
      if (!content) return new Notice('日志不能为空');
      currentLog.content = content;
      currentLog.editedAt = Date.now();
      task.updatedAt = Date.now();
      void this.plugin.saveTask(task).then(() => {
        new Notice('日志已保存');
        this.render();
      });
    });

    deleteButton.addEventListener('click', () => {
      if (!window.confirm('删除这条日志吗？')) return;
      const task = this.plugin.getTask(this.taskId);
      if (!task) return;
      task.logs = task.logs.filter((item) => item.id !== log.id);
      void this.plugin.saveTask(task).then(() => this.render());
    });
  }
}

class AllTasksModal extends Modal {
  constructor(app: App, private readonly plugin: TaskBoardPlugin) { super(app); }

  onOpen(): void {
    this.applyBackdropBlur();
    this.modalEl.addClass('task-board-all-tasks-modal');
    this.render();
  }

  onClose(): void { this.contentEl.empty(); }

  private applyBackdropBlur(): void {
    this.modalEl.parentElement?.querySelector<HTMLElement>('.modal-bg')?.classList.add('task-board-modal-backdrop');
  }

  private render(): void {
    const container = this.contentEl;
    container.empty();
    this.setTitle('显示所有任务');

    const search = container.createEl('input', {
      type: 'search',
      placeholder: '搜索任务名称、属性、标签……',
      cls: 'task-board-task-search',
    });

    const list = container.createDiv({ cls: 'task-all-list' });

    const draw = () => {
      list.empty();
      const keyword = search.value.trim().toLowerCase();
      const tasks = this.plugin.data.tasks.filter((task) => {
        if (!keyword) return true;
        const property = getProperty(this.plugin.data.settings, task.propertyId);
        return [task.title, property.name, ...task.tags].join(' ').toLowerCase().includes(keyword);
      });

      const active = tasks.filter((task) => !task.completed);
      const completed = tasks.filter((task) => task.completed);
      this.renderSection(list, '任务', active);
      this.renderSection(list, '已完成任务', completed);
    };

    search.addEventListener('input', draw);
    draw();
  }

  private renderSection(container: HTMLElement, title: string, tasks: Task[]): void {
    const section = container.createDiv({ cls: 'task-all-section' });
    section.createDiv({ text: `${title} · ${tasks.length}`, cls: 'task-all-section-title' });

    if (tasks.length === 0) {
      section.createDiv({ text: '没有任务。', cls: 'task-modal-empty-logs' });
      return;
    }

    tasks.forEach((task) => {
      const property = getProperty(this.plugin.data.settings, task.propertyId);
      const row = section.createDiv({ cls: 'task-all-row' });
      row.style.setProperty('--task-color', property.color);

      const main = row.createDiv({ cls: 'task-all-row-main' });
      main.createDiv({ text: task.title, cls: 'task-all-row-title' });
      const meta = main.createDiv({ cls: 'task-all-row-meta' });
      meta.createSpan({ text: property.name });
      task.tags.forEach((tag) => meta.createSpan({ text: `#${tag}`, cls: 'task-board-tag' }));
      if (task.completed) meta.createSpan({ text: '已完成', cls: 'task-card-completed-badge' });

      const updated = main.createDiv({ text: `最近编辑 ${formatDate(task.updatedAt)}`, cls: 'task-all-row-time' });

      const showLabel = row.createEl('label', { cls: 'task-all-show-control' });
      showLabel.createSpan({ text: '显示' });
      const checkbox = showLabel.createEl('input', { type: 'checkbox' });
      checkbox.checked = task.visibleOnBoard;
      checkbox.addEventListener('click', (event) => event.stopPropagation());
      checkbox.addEventListener('change', () => {
        task.visibleOnBoard = checkbox.checked;
        void this.plugin.saveTask(task).then(() => this.render());
      });

      row.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target === checkbox || target.closest('.task-all-show-control')) return;
        this.close();
        new TaskModal(this.app, this.plugin, task.id).open();
      });
    });
  }
}

class MemoView extends ItemView {
  private selectedTopicId = '';

  constructor(leaf: WorkspaceLeaf, private readonly plugin: TaskBoardPlugin) { super(leaf); }

  getViewType(): string { return VIEW_TYPE_MEMO; }
  getDisplayText(): string { return '备忘录'; }
  getIcon(): string { return 'notebook-pen'; }
  async onOpen(): Promise<void> { this.render(); }
  async onClose(): Promise<void> { this.contentEl.empty(); }

  render(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass('task-memo-view');

    const header = root.createDiv({ cls: 'task-board-header' });
    const headerText = header.createDiv({ cls: 'task-board-header-text' });
    headerText.createEl('h2', { text: '备忘录', cls: 'task-board-heading' });
    headerText.createDiv({ text: '主题 → 多个笔记', cls: 'task-board-subtitle' });
    const actions = header.createDiv({ cls: 'task-board-header-actions' });
    const addTopic = actions.createEl('button', { text: '+ 添加主题', cls: 'task-board-secondary-button' });
    addTopic.addEventListener('click', () => {
      new TextInputModal(this.app, '添加主题', '输入主题名称', async (value) => {
        if (!value) return;
        const now = Date.now();
        const topic: MemoTopic = { id: createId('topic'), order: this.plugin.data.memoTopics.length, title: value, pinned: false, notes: [], createdAt: now, updatedAt: now };
        this.plugin.data.memoTopics.push(topic);
        this.selectedTopicId = topic.id;
        await this.plugin.savePluginData();
        this.render();
      }).open();
    });

    const layout = root.createDiv({ cls: 'task-memo-layout' });
    const topicsPane = layout.createDiv({ cls: 'task-memo-topics' });
    topicsPane.createDiv({ text: '主题', cls: 'task-memo-pane-title' });

    if (this.plugin.data.memoTopics.length === 0) {
      topicsPane.createDiv({ text: '还没有主题。', cls: 'task-modal-empty-logs' });
    }

    const sortedTopics = [...this.plugin.data.memoTopics].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.order - b.order;
    });

    sortedTopics.forEach((topic) => {
      const row = topicsPane.createDiv({ cls: `task-memo-topic-row${topic.id === this.selectedTopicId ? ' is-selected' : ''}${topic.pinned ? ' is-pinned' : ''}` });
      let didDrag = false;
      const titleRow = row.createDiv({ cls: 'task-memo-topic-title-row' });
      titleRow.createDiv({ text: topic.title, cls: 'task-memo-topic-title' });
      if (topic.pinned) titleRow.createSpan({ text: '📌', cls: 'task-memo-topic-pin' });
      row.createDiv({ text: `${topic.notes.length} 条笔记`, cls: 'task-memo-topic-count' });
      row.addEventListener('click', () => {
        if (didDrag) return;
        this.selectedTopicId = topic.id;
        this.render();
      });
      row.draggable = true;
      row.addEventListener('dragstart', (event) => {
        event.stopPropagation();
        didDrag = true;
        row.addClass('is-dragging');
        event.dataTransfer?.setData('text/task-board-topic-id', topic.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragover', (event) => {
        const draggedId = event.dataTransfer?.types.includes('text/task-board-topic-id');
        if (!draggedId) return;
        event.preventDefault();
        row.addClass('is-drag-over');
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      });
      row.addEventListener('dragleave', () => row.removeClass('is-drag-over'));
      row.addEventListener('dragend', () => {
        row.removeClass('is-dragging');
        row.removeClass('is-drag-over');
        window.setTimeout(() => { didDrag = false; }, 250);
      });
      row.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        row.removeClass('is-drag-over');
        const draggedId = event.dataTransfer?.getData('text/task-board-topic-id');
        if (draggedId) void this.plugin.reorderMemoTopics(draggedId, topic.id);
      });
      row.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.showTopicContextMenu(event, topic);
      });
    });

    let topic = this.plugin.data.memoTopics.find((item) => item.id === this.selectedTopicId);
    if (!topic) topic = this.plugin.data.memoTopics[0];
    if (topic) this.selectedTopicId = topic.id;

    const notesPane = layout.createDiv({ cls: 'task-memo-notes' });
    const noteHeader = notesPane.createDiv({ cls: 'task-memo-notes-header' });
    noteHeader.createDiv({ text: topic?.title ?? '请选择主题', cls: 'task-memo-pane-title' });

    const addNote = noteHeader.createEl('button', { text: '+ 添加笔记', cls: 'task-board-secondary-button' });
    addNote.disabled = !topic;
    addNote.addEventListener('click', () => {
      if (!topic) return;
      const now = Date.now();
      const note: MemoNote = { id: createId('note'), order: 0, content: '', createdAt: now, updatedAt: now };
      note.order = topic.notes.length;
      topic.notes.push(note);
      topic.updatedAt = now;
      void this.plugin.savePluginData().then(() => {
        this.render();
        new MemoNoteModal(this.app, this.plugin, topic!.id, note.id).open();
      });
    });

    if (topic) {
      const noteList = notesPane.createDiv({ cls: 'task-memo-note-list' });
      [...topic.notes]
        .sort((a, b) => a.order - b.order)
        .forEach((note) => {
          const card = noteList.createDiv({ cls: 'task-memo-note-card' });
          let didDrag = false;
          const firstLine = note.content.trim().split(/\r?\n/).find((line) => line.trim())?.trim() ?? '';
          card.createDiv({ text: firstLine ? firstLine.slice(0, 40) : '新笔记', cls: 'task-memo-note-title' });
          card.createDiv({ text: note.content || '还没有内容。', cls: 'task-memo-note-preview' });
          card.createDiv({ text: `创建于 ${formatDate(note.createdAt)} · 编辑于 ${formatDate(note.updatedAt)}`, cls: 'task-memo-note-time' });
          card.addEventListener('click', () => {
            if (didDrag) return;
            new MemoNoteModal(this.app, this.plugin, topic!.id, note.id).open();
          });
          card.draggable = true;
          card.addEventListener('dragstart', (event) => {
            event.stopPropagation();
            didDrag = true;
            card.addClass('is-dragging');
            event.dataTransfer?.setData('text/task-board-note-id', note.id);
            event.dataTransfer?.setData('text/task-board-topic-id', topic!.id);
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
          });
          card.addEventListener('dragover', (event) => {
            if (!event.dataTransfer?.types.includes('text/task-board-note-id')) return;
            event.preventDefault();
            card.addClass('is-drag-over');
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
          });
          card.addEventListener('dragleave', () => card.removeClass('is-drag-over'));
          card.addEventListener('dragend', () => {
            card.removeClass('is-dragging');
            card.removeClass('is-drag-over');
            window.setTimeout(() => { didDrag = false; }, 250);
          });
          card.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            card.removeClass('is-drag-over');
            const draggedId = event.dataTransfer?.getData('text/task-board-note-id');
            const sourceTopicId = event.dataTransfer?.getData('text/task-board-topic-id');
            if (draggedId && sourceTopicId === topic!.id) {
              void this.plugin.reorderMemoNotes(topic!.id, draggedId, note.id);
            }
          });
          card.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.showNoteContextMenu(event, topic!, note);
          });
        });
    } else {
      notesPane.createDiv({ text: '先创建一个主题。', cls: 'task-memo-empty' });
    }
  }

  private showTopicContextMenu(event: MouseEvent, topic: MemoTopic): void {
    const menu = new Menu();
    menu.addItem((item) => {
      item.setTitle(topic.pinned ? '取消固定' : 'Pin / 固定').onClick(async () => {
        topic.pinned = !topic.pinned;
        topic.updatedAt = Date.now();
        await this.plugin.savePluginData();
        this.render();
      });
    });

    menu.addItem((item) => {
      item.setTitle('重命名').onClick(() => {
        new TextInputModal(
          this.app,
          '重命名主题',
          '输入新的主题名称',
          async (value) => {
            topic.title = value;
            topic.updatedAt = Date.now();
            await this.plugin.savePluginData();
            this.render();
          },
        ).open();
      });
    });

    menu.addItem((item) => {
      item.setTitle('添加笔记').onClick(() => {
        const now = Date.now();
        const note: MemoNote = { id: createId('note'), order: 0, content: '', createdAt: now, updatedAt: now };
        note.order = topic.notes.length;
        topic.notes.push(note);
        topic.updatedAt = now;
        void this.plugin.savePluginData().then(() => {
          this.render();
          new MemoNoteModal(this.app, this.plugin, topic.id, note.id).open();
        });
      });
    });

    menu.addItem((item) => {
      item.setTitle('删除主题').onClick(async () => {
        const ok = window.confirm(`确定删除主题“${topic.title}”及其中的 ${topic.notes.length} 条笔记吗？`);
        if (!ok) return;
        this.plugin.data.memoTopics = this.plugin.data.memoTopics.filter((item) => item.id !== topic.id);
        if (this.selectedTopicId === topic.id) this.selectedTopicId = '';
        await this.plugin.savePluginData();
        this.render();
        new Notice('主题已删除');
      });
    });

    menu.showAtMouseEvent(event);
  }

  private showNoteContextMenu(event: MouseEvent, topic: MemoTopic, note: MemoNote): void {
    const menu = new Menu();
    menu.addItem((item) => {
      item.setTitle('编辑笔记').onClick(() => new MemoNoteModal(this.app, this.plugin, topic.id, note.id).open());
    });

    menu.addItem((item) => {
      item.setTitle('删除笔记').onClick(async () => {
        const ok = window.confirm('确定删除这条笔记吗？');
        if (!ok) return;
        topic.notes = topic.notes.filter((item) => item.id !== note.id);
        topic.updatedAt = Date.now();
        await this.plugin.savePluginData();
        this.render();
        new Notice('笔记已删除');
      });
    });

    menu.showAtMouseEvent(event);
  }
}

class MemoNoteModal extends Modal {
  constructor(
    app: App,
    private readonly plugin: TaskBoardPlugin,
    private readonly topicId: string,
    private readonly noteId: string,
  ) { super(app); }

  onOpen(): void {
    this.applyBackdropBlur();
    this.modalEl.addClass('task-board-memo-note-modal');
    this.render();
  }

  onClose(): void { this.contentEl.empty(); }

  private applyBackdropBlur(): void {
    this.modalEl.parentElement?.querySelector<HTMLElement>('.modal-bg')?.classList.add('task-board-modal-backdrop');
  }

  private render(): void {
    const topic = this.plugin.data.memoTopics.find((item) => item.id === this.topicId);
    const note = topic?.notes.find((item) => item.id === this.noteId);
    if (!topic || !note) {
      this.contentEl.setText('笔记不存在。');
      return;
    }

    this.contentEl.empty();
    this.setTitle('编辑笔记');
    this.contentEl.createDiv({ text: topic.title, cls: 'task-modal-meta' });
    const textarea = this.contentEl.createEl('textarea', { cls: 'task-memo-note-editor', placeholder: '记录你的想法……' });
    textarea.value = note.content;

    const meta = this.contentEl.createDiv({ text: `创建于 ${formatDate(note.createdAt)} · 上次编辑 ${formatDate(note.updatedAt)}`, cls: 'task-modal-meta' });
    const actions = this.contentEl.createDiv({ cls: 'task-modal-bottom-actions' });
    const save = actions.createEl('button', { text: '保存', cls: 'mod-cta' });
    save.addEventListener('click', () => {
      note.content = textarea.value;
      note.updatedAt = Date.now();
      topic.updatedAt = note.updatedAt;
      void this.plugin.savePluginData().then(() => {
        this.plugin.refreshViews();
        new Notice('笔记已保存');
        meta.setText(`创建于 ${formatDate(note.createdAt)} · 上次编辑 ${formatDate(note.updatedAt)}`);
      });
    });
  }
}

class TextInputModal extends Modal {
  constructor(
    app: App,
    private readonly title: string,
    private readonly placeholder: string,
    private readonly onSubmit: (value: string) => void | Promise<void>,
  ) { super(app); }

  onOpen(): void {
    this.setTitle(this.title);
    const input = this.contentEl.createEl('input', { type: 'text', placeholder: this.placeholder });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void this.submit(input.value);
      }
    });
    const actions = this.contentEl.createDiv({ cls: 'task-modal-bottom-actions' });
    const cancel = actions.createEl('button', { text: '取消' });
    const ok = actions.createEl('button', { text: '确定', cls: 'mod-cta' });
    cancel.addEventListener('click', () => this.close());
    ok.addEventListener('click', () => void this.submit(input.value));
    window.setTimeout(() => input.focus(), 0);
  }

  onClose(): void { this.contentEl.empty(); }

  private async submit(value: string): Promise<void> {
    const clean = value.trim();
    if (!clean) {
      new Notice('请输入内容');
      return;
    }
    await this.onSubmit(clean);
    this.close();
  }
}

class StatsView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private readonly plugin: TaskBoardPlugin) { super(leaf); }
  getViewType(): string { return VIEW_TYPE_STATS; }
  getDisplayText(): string { return '任务统计'; }
  getIcon(): string { return 'table-properties'; }
  async onOpen(): Promise<void> { this.render(); }
  async onClose(): Promise<void> { this.contentEl.empty(); }

  render(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass('task-stats-view');

    const header = root.createDiv({ cls: 'task-board-header' });
    const headerText = header.createDiv({ cls: 'task-board-header-text' });
    headerText.createEl('h2', { text: '任务统计', cls: 'task-board-heading' });
    headerText.createDiv({ text: '统计维度来自设置中的内置维度和自定义任务指标。', cls: 'task-board-subtitle' });
    const settingsButton = header.createEl('button', { text: '打开设置', cls: 'task-board-secondary-button' });
    settingsButton.addEventListener('click', () => {
      // Obsidian 不提供直接的“打开指定设置页”公共 API；这里给出提示，避免依赖内部 API。
      new Notice('请打开 设置 → 第三方插件 → Task Board');
    });

    const dimensions = this.getDimensions();
    const table = root.createEl('table', { cls: 'task-stats-table' });
    const thead = table.createEl('thead');
    const headRow = thead.createEl('tr');
    headRow.createEl('th', { text: '任务' });
    dimensions.forEach((dimension) => headRow.createEl('th', { text: dimension.name }));

    const tbody = table.createEl('tbody');
    this.plugin.data.tasks.forEach((task) => {
      const tr = tbody.createEl('tr');
      const taskCell = tr.createEl('td', { cls: 'task-stats-task-cell' });
      const property = getProperty(this.plugin.data.settings, task.propertyId);
      taskCell.createDiv({ text: task.title, cls: 'task-stats-task-name' });
      taskCell.createDiv({ text: `${property.name}${task.completed ? ' · 已完成' : ''}`, cls: 'task-stats-task-meta' });

      dimensions.forEach((dimension) => {
        const td = tr.createEl('td', { cls: 'task-stats-value-cell' });
        if (dimension.id === 'completed') td.setText(task.completed ? '✓' : '—');
        else if (dimension.id === 'logCount') td.setText(String(task.logs.length));
        else if (dimension.id === 'tagCount') td.setText(String(task.tags.length));
        else td.setText(task.metrics[dimension.id] ? '✓' : '—');
      });
    });

    if (this.plugin.data.tasks.length === 0) {
      const tr = tbody.createEl('tr');
      const td = tr.createEl('td', { text: '暂无任务。' });
      td.colSpan = dimensions.length + 1;
    }
  }

  private getDimensions(): Array<{ id: string; name: string }> {
    const map = new Map<string, string>([
      ['completed', '已完成'],
      ['logCount', '日志数量'],
      ['tagCount', '标签数量'],
    ]);
    this.plugin.data.settings.metrics.forEach((metric) => map.set(metric.id, metric.name));
    return this.plugin.data.settings.statsColumns
      .map((id) => ({ id, name: map.get(id) ?? id }))
      .filter((dimension, index, array) => array.findIndex((item) => item.id === dimension.id) === index);
  }
}
