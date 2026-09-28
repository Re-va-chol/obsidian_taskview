var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// main.ts
var main_exports = {};
__export(main_exports, {
  VIEW_TYPE_MEMO: () => VIEW_TYPE_MEMO,
  VIEW_TYPE_STATS: () => VIEW_TYPE_STATS,
  VIEW_TYPE_TASK_BOARD: () => VIEW_TYPE_TASK_BOARD,
  default: () => TaskBoardPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var VIEW_TYPE_TASK_BOARD = "task-board-view";
var VIEW_TYPE_MEMO = "task-board-memo-view";
var VIEW_TYPE_STATS = "task-board-stats-view";
var DEFAULT_PROPERTIES = [
  { id: "work", name: "\u5DE5\u4F5C", color: "#3b82f6" },
  { id: "study", name: "\u5B66\u4E60", color: "#22c55e" },
  { id: "personal", name: "\u4E2A\u4EBA", color: "#f59e0b" },
  { id: "project", name: "\u9879\u76EE", color: "#a855f7" },
  { id: "other", name: "\u5176\u4ED6", color: "#64748b" }
];
var DEFAULT_SETTINGS = {
  columns: 3,
  rows: 3,
  cardLogCount: 3,
  cardGap: 12,
  backgroundOpacity: 22,
  backgroundOverlay: 24,
  backgroundBlur: 0,
  properties: DEFAULT_PROPERTIES,
  tags: ["\u91CD\u8981", "\u7D27\u6025", "\u957F\u671F", "\u5DE5\u4F5C\u65E5\u5E38"],
  metrics: [
    { id: "first-edit", name: "\u5DF2\u5B8C\u6210\u521D\u6B65\u4FEE\u6539" },
    { id: "submitted", name: "\u5DF2\u7ECF\u63D0\u4EA4\u4FEE\u6539" }
  ],
  statsColumns: ["completed", "logCount", "first-edit", "submitted"]
};
function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}
function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function formatDate(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}
function shortDate(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}
function safePositiveInt(value, fallback, min = 1, max = 12) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}
function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}
function normalizeSettings(raw) {
  const defaults = cloneDefaults();
  const settings = raw != null ? raw : {};
  const rawProperties = Array.isArray(settings.properties) ? settings.properties : defaults.properties;
  const properties = rawProperties.map((property, index) => {
    var _a, _b, _c;
    return {
      id: String((_a = property == null ? void 0 : property.id) != null ? _a : `property-${index + 1}`),
      name: String((_b = property == null ? void 0 : property.name) != null ? _b : "").trim() || `\u5C5E\u6027 ${index + 1}`,
      color: String((_c = property == null ? void 0 : property.color) != null ? _c : "#64748b")
    };
  }).filter((property) => property.name);
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
    metrics: Array.isArray(settings.metrics) ? settings.metrics.map((metric, index) => {
      var _a, _b;
      return {
        id: String((_a = metric == null ? void 0 : metric.id) != null ? _a : `metric-${index + 1}`),
        name: String((_b = metric == null ? void 0 : metric.name) != null ? _b : "").trim() || `\u6307\u6807 ${index + 1}`
      };
    }).filter((metric) => metric.name) : defaults.metrics,
    statsColumns: uniqueStrings(settings.statsColumns)
  };
}
function createDemoTasks(settings) {
  const now = Date.now();
  const minutes = (n) => now - n * 6e4;
  const propertyId = (id) => settings.properties.some((p) => p.id === id) ? id : settings.properties[0].id;
  const demo = [
    ["\u5B8C\u6210 SQL \u6570\u636E\u63D0\u53D6", "work", ["\u91CD\u8981"], "\u5B8C\u6210\u7533\u8BF7\u3001\u5408\u540C\u3001\u8D37\u6B3E\u8868\u5173\u8054\u3002"],
    ["\u590D\u4E60 TypeScript", "study", ["\u957F\u671F"], "\u590D\u4E60 interface\u3001type \u548C\u6CDB\u578B\u3002"],
    ["\u6574\u7406 Obsidian \u63D2\u4EF6\u9700\u6C42", "project", ["\u91CD\u8981"], "\u5B8C\u6210 3\xD73 \u5361\u7247\u5E03\u5C40\u8BBE\u8BA1\u3002"],
    ["\u8DD1\u6B65 30 \u5206\u949F", "personal", ["\u65E5\u5E38"], "\u4ECA\u5929\u5B8C\u6210 5 \u516C\u91CC\u3002"],
    ["\u8BBE\u8BA1\u4EFB\u52A1\u5361\u7247", "project", ["\u957F\u671F"], "\u589E\u52A0\u4EFB\u52A1\u7C7B\u578B\u989C\u8272\u3002"],
    ["\u6574\u7406\u672C\u5468\u5DE5\u4F5C", "work", ["\u5DE5\u4F5C\u65E5\u5E38"], "\u6574\u7406\u672C\u5468\u91CD\u70B9\u4E8B\u9879\u3002"],
    ["\u9605\u8BFB\u6280\u672F\u6587\u6863", "study", ["\u957F\u671F"], "\u9605\u8BFB Obsidian ItemView \u6587\u6863\u3002"],
    ["\u8D2D\u4E70\u751F\u6D3B\u7528\u54C1", "personal", [], ""],
    ["\u5269\u4F59\u4EFB\u52A1\u793A\u4F8B 1", "other", ["\u7D27\u6025"], ""],
    ["\u5269\u4F59\u4EFB\u52A1\u793A\u4F8B 2", "other", [], ""]
  ];
  const boardCapacity = Math.max(0, settings.columns * settings.rows);
  return demo.map(([title, oldProperty, tags, log], index) => {
    const createdAt = minutes(480 - index * 20);
    const updatedAt = minutes(20 + index * 10);
    const metrics = {};
    settings.metrics.forEach((metric, metricIndex) => {
      metrics[metric.id] = index < 2 && metricIndex === 0;
    });
    const logs = log ? [{ id: createId("log"), content: log, editedAt: updatedAt }] : [];
    return {
      id: createId("task"),
      title,
      propertyId: propertyId(oldProperty),
      tags: uniqueStrings(tags),
      metrics,
      logs,
      createdAt,
      updatedAt,
      completed: false,
      visibleOnBoard: index < boardCapacity
    };
  });
}
function getProperty(settings, propertyId) {
  var _a, _b;
  return (_b = (_a = settings.properties.find((property) => property.id === propertyId)) != null ? _a : settings.properties[0]) != null ? _b : {
    id: "other",
    name: "\u5176\u4ED6",
    color: "#64748b"
  };
}
var TaskBoardPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "data", {
      tasks: [],
      settings: cloneDefaults(),
      memoTopics: []
    });
  }
  async onload() {
    await this.loadPluginData();
    this.registerView(VIEW_TYPE_TASK_BOARD, (leaf) => new TaskBoardView(leaf, this));
    this.registerView(VIEW_TYPE_MEMO, (leaf) => new MemoView(leaf, this));
    this.registerView(VIEW_TYPE_STATS, (leaf) => new StatsView(leaf, this));
    this.addSettingTab(new TaskBoardSettingTab(this.app, this));
    this.addRibbonIcon("layout-dashboard", "\u6253\u5F00\u4EFB\u52A1\u770B\u677F", () => void this.activateView(VIEW_TYPE_TASK_BOARD));
    this.addRibbonIcon("notebook-pen", "\u6253\u5F00\u5907\u5FD8\u5F55", () => void this.activateView(VIEW_TYPE_MEMO));
    this.addRibbonIcon("table-properties", "\u6253\u5F00\u4EFB\u52A1\u7EDF\u8BA1", () => void this.activateView(VIEW_TYPE_STATS));
    this.addCommand({
      id: "open-task-board",
      name: "\u6253\u5F00\u4EFB\u52A1\u770B\u677F",
      callback: () => void this.activateView(VIEW_TYPE_TASK_BOARD)
    });
    this.addCommand({
      id: "open-memo",
      name: "\u6253\u5F00\u5907\u5FD8\u5F55",
      callback: () => void this.activateView(VIEW_TYPE_MEMO)
    });
    this.addCommand({
      id: "open-stats",
      name: "\u6253\u5F00\u4EFB\u52A1\u7EDF\u8BA1",
      callback: () => void this.activateView(VIEW_TYPE_STATS)
    });
    this.addCommand({
      id: "create-task",
      name: "\u65B0\u5EFA\u4EFB\u52A1",
      callback: () => void this.createAndOpenTask()
    });
  }
  async loadPluginData() {
    const raw = await this.loadData();
    const settings = normalizeSettings(raw == null ? void 0 : raw.settings);
    const rawTasks = Array.isArray(raw == null ? void 0 : raw.tasks) ? raw.tasks : [];
    const boardCapacity = Math.max(0, settings.columns * settings.rows);
    let tasks;
    if (rawTasks.length === 0) {
      tasks = createDemoTasks(settings);
    } else {
      tasks = rawTasks.map((rawTask, index) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
        const oldType = String((_d = (_c = (_a = rawTask.propertyId) != null ? _a : rawTask.type) != null ? _c : (_b = settings.properties[0]) == null ? void 0 : _b.id) != null ? _d : "other");
        const propertyId = settings.properties.some((p) => p.id === oldType) ? oldType : (_f = (_e = settings.properties[0]) == null ? void 0 : _e.id) != null ? _f : "other";
        const metrics = {};
        const oldMetrics = rawTask.metrics && typeof rawTask.metrics === "object" ? rawTask.metrics : {};
        settings.metrics.forEach((metric) => {
          metrics[metric.id] = Boolean(oldMetrics[metric.id]);
        });
        return {
          id: String((_g = rawTask.id) != null ? _g : createId("task")),
          title: String((_h = rawTask.title) != null ? _h : "\u672A\u547D\u540D\u4EFB\u52A1"),
          propertyId,
          tags: uniqueStrings(rawTask.tags),
          metrics,
          logs: Array.isArray(rawTask.logs) ? rawTask.logs.map((log) => {
            var _a2, _b2, _c2;
            return {
              id: String((_a2 = log.id) != null ? _a2 : createId("log")),
              content: String((_b2 = log.content) != null ? _b2 : ""),
              editedAt: Number((_c2 = log.editedAt) != null ? _c2 : Date.now())
            };
          }) : [],
          createdAt: Number((_i = rawTask.createdAt) != null ? _i : Date.now()),
          updatedAt: Number((_j = rawTask.updatedAt) != null ? _j : Date.now()),
          completed: Boolean(rawTask.completed),
          visibleOnBoard: typeof rawTask.visibleOnBoard === "boolean" ? rawTask.visibleOnBoard : index < boardCapacity,
          backgroundImagePath: typeof rawTask.backgroundImagePath === "string" && rawTask.backgroundImagePath.trim() ? rawTask.backgroundImagePath : void 0
        };
      });
    }
    const memoTopics = Array.isArray(raw == null ? void 0 : raw.memoTopics) ? raw.memoTopics.map((topic, topicIndex) => {
      var _a, _b, _c, _d;
      return {
        id: String((_a = topic.id) != null ? _a : createId("topic")),
        order: Number.isFinite(Number(topic.order)) ? Number(topic.order) : topicIndex,
        title: String((_b = topic.title) != null ? _b : "\u672A\u547D\u540D\u4E3B\u9898"),
        pinned: Boolean(topic.pinned),
        createdAt: Number((_c = topic.createdAt) != null ? _c : Date.now()),
        updatedAt: Number((_d = topic.updatedAt) != null ? _d : Date.now()),
        notes: Array.isArray(topic.notes) ? topic.notes.map((note, noteIndex) => {
          var _a2, _b2, _c2, _d2;
          return {
            id: String((_a2 = note.id) != null ? _a2 : createId("note")),
            order: Number.isFinite(Number(note.order)) ? Number(note.order) : noteIndex,
            content: String((_b2 = note.content) != null ? _b2 : ""),
            createdAt: Number((_c2 = note.createdAt) != null ? _c2 : Date.now()),
            updatedAt: Number((_d2 = note.updatedAt) != null ? _d2 : Date.now())
          };
        }).sort((a, b) => a.order - b.order).map((note, index) => ({ ...note, order: index })) : []
      };
    }).sort((a, b) => a.order - b.order).map((topic, index) => ({ ...topic, order: index })) : [];
    this.data = { tasks, settings, memoTopics };
    const requiredStats = ["completed", "logCount"];
    for (const stat of requiredStats) {
      if (!this.data.settings.statsColumns.includes(stat)) {
        this.data.settings.statsColumns.push(stat);
      }
    }
    await this.savePluginData();
  }
  async savePluginData() {
    await this.saveData(this.data);
  }
  async activateView(viewType) {
    const existing = this.app.workspace.getLeavesOfType(viewType)[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: viewType, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }
  getTask(taskId) {
    return this.data.tasks.find((task) => task.id === taskId);
  }
  async createTask(title = "\u65B0\u4EFB\u52A1") {
    var _a, _b;
    const now = Date.now();
    const metrics = {};
    this.data.settings.metrics.forEach((metric) => {
      metrics[metric.id] = false;
    });
    const task = {
      id: createId("task"),
      title,
      propertyId: (_b = (_a = this.data.settings.properties[0]) == null ? void 0 : _a.id) != null ? _b : "other",
      tags: [],
      metrics,
      logs: [],
      createdAt: now,
      updatedAt: now,
      completed: false,
      visibleOnBoard: true,
      backgroundImagePath: void 0
    };
    this.data.tasks.unshift(task);
    await this.savePluginData();
    this.refreshViews();
    return task;
  }
  async createAndOpenTask() {
    const task = await this.createTask();
    new TaskModal(this.app, this, task.id).open();
  }
  async deleteTask(taskId) {
    const task = this.getTask(taskId);
    if (task == null ? void 0 : task.backgroundImagePath) await this.deleteBackgroundFile(task.backgroundImagePath);
    this.data.tasks = this.data.tasks.filter((item) => item.id !== taskId);
    await this.savePluginData();
    this.refreshViews();
    new import_obsidian.Notice("\u4EFB\u52A1\u5DF2\u5220\u9664");
  }
  async saveTask(task) {
    task.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshViews();
  }
  async ensureVaultFolder(path) {
    const parts = (0, import_obsidian.normalizePath)(path).split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }
  async deleteBackgroundFile(path) {
    const file = this.app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(path));
    if (file instanceof import_obsidian.TFile) {
      try {
        await this.app.vault.delete(file);
      } catch (e) {
      }
    }
  }
  async setTaskBackground(taskId, file) {
    const task = this.getTask(taskId);
    if (!task) return;
    if (!file.type.startsWith("image/")) {
      new import_obsidian.Notice("\u8BF7\u9009\u62E9\u56FE\u7247\u6587\u4EF6\u3002");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      new import_obsidian.Notice("\u56FE\u7247\u4E0D\u80FD\u8D85\u8FC7 10 MB\u3002\u5EFA\u8BAE\u4F7F\u7528\u538B\u7F29\u540E\u7684 JPG/PNG\u3002");
      return;
    }
    const folder = "Task Board/Backgrounds";
    await this.ensureVaultFolder(folder);
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80) || "background-image";
    const path = (0, import_obsidian.normalizePath)(`${folder}/${task.id}-${Date.now()}-${cleanName}`);
    await this.app.vault.createBinary(path, await file.arrayBuffer());
    const oldPath = task.backgroundImagePath;
    task.backgroundImagePath = path;
    await this.savePluginData();
    if (oldPath && oldPath !== path) await this.deleteBackgroundFile(oldPath);
    this.refreshViews();
  }
  async clearTaskBackground(taskId) {
    const task = this.getTask(taskId);
    if (!task) return;
    const oldPath = task.backgroundImagePath;
    task.backgroundImagePath = void 0;
    await this.savePluginData();
    if (oldPath) await this.deleteBackgroundFile(oldPath);
    this.refreshViews();
  }
  getTaskBackgroundUrl(task) {
    if (!task.backgroundImagePath) return null;
    const file = this.app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(task.backgroundImagePath));
    return file instanceof import_obsidian.TFile ? this.app.vault.getResourcePath(file) : null;
  }
  async reorderVisibleTasks(draggedId, targetId) {
    if (draggedId === targetId) return;
    const visibleIndexes = this.data.tasks.map((task, index) => ({ task, index })).filter(({ task }) => task.visibleOnBoard).map(({ index }) => index);
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
  async reorderMemoTopics(draggedId, targetId) {
    if (draggedId === targetId) return;
    const dragged = this.data.memoTopics.find((topic) => topic.id === draggedId);
    const target = this.data.memoTopics.find((topic) => topic.id === targetId);
    if (!dragged || !target || dragged.pinned !== target.pinned) return;
    const group = this.data.memoTopics.filter((topic) => topic.pinned === dragged.pinned).sort((a, b) => a.order - b.order);
    const from = group.findIndex((topic) => topic.id === draggedId);
    const to = group.findIndex((topic) => topic.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = group.splice(from, 1);
    group.splice(to, 0, item);
    group.forEach((topic, index) => {
      topic.order = index;
    });
    const pinnedGroup = this.data.memoTopics.filter((topic) => topic.pinned).sort((a, b) => a.order - b.order);
    const unpinnedGroup = this.data.memoTopics.filter((topic) => !topic.pinned).sort((a, b) => a.order - b.order);
    let order = 0;
    [...pinnedGroup, ...unpinnedGroup].forEach((topic) => {
      topic.order = order++;
    });
    this.data.memoTopics = [...pinnedGroup, ...unpinnedGroup];
    await this.savePluginData();
    this.refreshViews();
  }
  async reorderMemoNotes(topicId, draggedId, targetId) {
    if (draggedId === targetId) return;
    const topic = this.data.memoTopics.find((item2) => item2.id === topicId);
    if (!topic) return;
    const from = topic.notes.findIndex((note) => note.id === draggedId);
    const to = topic.notes.findIndex((note) => note.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = topic.notes.splice(from, 1);
    topic.notes.splice(to, 0, item);
    topic.notes.forEach((note, index) => {
      note.order = index;
    });
    topic.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshViews();
  }
  refreshViews() {
    window.requestAnimationFrame(() => {
      var _a;
      for (const viewType of [VIEW_TYPE_TASK_BOARD, VIEW_TYPE_MEMO, VIEW_TYPE_STATS]) {
        for (const leaf of this.app.workspace.getLeavesOfType(viewType)) {
          const view = leaf.view;
          if (((_a = view == null ? void 0 : view.getViewType) == null ? void 0 : _a.call(view)) === viewType && typeof view.render === "function") {
            view.render();
          }
        }
      }
    });
  }
};
var TaskBoardSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "taskBoardPlugin");
    this.taskBoardPlugin = plugin;
  }
  display() {
    const container = this.containerEl;
    container.empty();
    container.createEl("h2", { text: "Task Board \u8BBE\u7F6E" });
    container.createEl("h3", { text: "\u4EFB\u52A1\u754C\u9762" });
    new import_obsidian.Setting(container).setName("\u6A2A\u5411\u5361\u7247\u6570\u91CF").setDesc("\u4F8B\u5982 3 \u8868\u793A\u6BCF\u884C 3 \u5F20\u5361\u7247\u3002").addText((text) => text.setValue(String(this.taskBoardPlugin.data.settings.columns)).onChange(async (value) => {
      this.taskBoardPlugin.data.settings.columns = safePositiveInt(Number(value), 3, 1, 8);
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
    }));
    new import_obsidian.Setting(container).setName("\u7EB5\u5411\u5361\u7247\u6570\u91CF").setDesc("\u4F8B\u5982 3 \u8868\u793A\u603B\u5171 3 \u884C\u3002\u6700\u540E\u4E00\u683C\u56FA\u5B9A\u4E3A\u201C\u663E\u793A\u6240\u6709\u4EFB\u52A1\u201D\u3002").addText((text) => text.setValue(String(this.taskBoardPlugin.data.settings.rows)).onChange(async (value) => {
      this.taskBoardPlugin.data.settings.rows = safePositiveInt(Number(value), 3, 1, 8);
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
    }));
    new import_obsidian.Setting(container).setName("\u5361\u7247\u65E5\u5FD7\u6761\u6570").setDesc("\u5361\u7247\u4E0A\u6700\u591A\u663E\u793A\u6700\u8FD1\u51E0\u6761\u65E5\u5FD7\u3002").addText((text) => text.setValue(String(this.taskBoardPlugin.data.settings.cardLogCount)).onChange(async (value) => {
      this.taskBoardPlugin.data.settings.cardLogCount = safePositiveInt(Number(value), 3, 0, 10);
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
    }));
    new import_obsidian.Setting(container).setName("\u5361\u7247\u95F4\u8DDD").setDesc("\u4EFB\u52A1\u5361\u7247\u4E4B\u95F4\u7684\u95F4\u8DDD\uFF0C\u5355\u4F4D\u4E3A\u50CF\u7D20\u3002").addText((text) => text.setValue(String(this.taskBoardPlugin.data.settings.cardGap)).onChange(async (value) => {
      this.taskBoardPlugin.data.settings.cardGap = safePositiveInt(Number(value), 12, 4, 24);
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
    }));
    container.createEl("h4", { text: "\u4EFB\u52A1\u80CC\u666F\u56FE\u7247" });
    container.createDiv({
      text: "\u4EFB\u52A1\u53EF\u4EE5\u4F7F\u7528\u672C\u5730\u56FE\u7247\u4F5C\u4E3A\u5361\u7247\u80CC\u666F\u3002\u56FE\u7247\u4F1A\u590D\u5236\u5230\u5F53\u524D Vault \u7684 \u201CTask Board/Backgrounds\u201D \u6587\u4EF6\u5939\uFF0C\u56E0\u6B64\u6362\u7535\u8111\u5E76\u540C\u6B65 Vault \u540E\u4ECD\u7136\u53EF\u4EE5\u4F7F\u7528\u3002",
      cls: "task-board-setting-hint"
    });
    new import_obsidian.Setting(container).setName("\u80CC\u666F\u56FE\u7247\u900F\u660E\u5EA6").setDesc("\u6570\u503C\u8D8A\u9AD8\uFF0C\u80CC\u666F\u56FE\u7247\u8D8A\u660E\u663E\u30020 \u8868\u793A\u5B8C\u5168\u9690\u85CF\u3002").addSlider((slider) => slider.setLimits(0, 100, 1).setValue(this.taskBoardPlugin.data.settings.backgroundOpacity).setDynamicTooltip().onChange(async (value) => {
      this.taskBoardPlugin.data.settings.backgroundOpacity = value;
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
    }));
    new import_obsidian.Setting(container).setName("\u80CC\u666F\u56FE\u7247\u6A21\u7CCA").setDesc("\u7ED9\u80CC\u666F\u56FE\u7247\u589E\u52A0\u8F7B\u5FAE\u6A21\u7CCA\uFF0C\u8BA9\u4EFB\u52A1\u6587\u5B57\u66F4\u5BB9\u6613\u9605\u8BFB\u3002").addSlider((slider) => slider.setLimits(0, 12, 1).setValue(this.taskBoardPlugin.data.settings.backgroundBlur).setDynamicTooltip().onChange(async (value) => {
      this.taskBoardPlugin.data.settings.backgroundBlur = value;
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
    }));
    new import_obsidian.Setting(container).setName("\u80CC\u666F\u906E\u7F69\u5F3A\u5EA6").setDesc("\u5728\u80CC\u666F\u56FE\u7247\u4E0A\u53E0\u52A0\u4E00\u5C42\u534A\u900F\u660E\u906E\u7F69\uFF0C\u63D0\u5347\u5361\u7247\u6587\u5B57\u7684\u53EF\u8BFB\u6027\u3002").addSlider((slider) => slider.setLimits(0, 85, 1).setValue(this.taskBoardPlugin.data.settings.backgroundOverlay).setDynamicTooltip().onChange(async (value) => {
      this.taskBoardPlugin.data.settings.backgroundOverlay = value;
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
    }));
    container.createEl("h3", { text: "\u4EFB\u52A1\u5C5E\u6027" });
    container.createDiv({
      text: "\u5C5E\u6027\u5C31\u662F\u4EFB\u52A1\u7684\u4E3B\u5206\u7C7B\uFF0C\u4F8B\u5982\u201C\u5DE5\u4F5C\u3001\u5B66\u4E60\u3001\u9879\u76EE\u201D\u3002\u6BCF\u4E2A\u5C5E\u6027\u53EF\u4EE5\u8BBE\u7F6E\u81EA\u5DF1\u7684\u989C\u8272\u3002",
      cls: "task-board-setting-hint"
    });
    const propertiesContainer = container.createDiv({ cls: "task-board-setting-list" });
    this.taskBoardPlugin.data.settings.properties.forEach((property) => {
      this.renderPropertySetting(propertiesContainer, property);
    });
    new import_obsidian.Setting(container).addButton((button) => button.setButtonText("\uFF0B \u6DFB\u52A0\u4EFB\u52A1\u5C5E\u6027").onClick(async () => {
      this.taskBoardPlugin.data.settings.properties.push({
        id: createId("property"),
        name: "\u65B0\u5C5E\u6027",
        color: "#64748b"
      });
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
      this.display();
    }));
    container.createEl("h3", { text: "\u4EFB\u52A1\u6807\u7B7E" });
    container.createDiv({
      text: "\u6BCF\u884C\u8F93\u5165\u4E00\u4E2A\u6807\u7B7E\u3002\u4EFB\u52A1\u7F16\u8F91\u7A97\u53E3\u4F1A\u63D0\u4F9B\u52FE\u9009\u6846\u3002",
      cls: "task-board-setting-hint"
    });
    new import_obsidian.Setting(container).setName("\u53EF\u7528\u6807\u7B7E").addTextArea((text) => text.setPlaceholder("\u91CD\u8981\n\u7D27\u6025\n\u957F\u671F").setValue(this.taskBoardPlugin.data.settings.tags.join("\n")).onChange(async (value) => {
      this.taskBoardPlugin.data.settings.tags = uniqueStrings(value.split(/[\n,，]/));
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
    }));
    container.createEl("h3", { text: "\u4EFB\u52A1\u6307\u6807 / \u7EDF\u8BA1\u7EF4\u5EA6" });
    container.createDiv({
      text: "\u8FD9\u4E9B\u6307\u6807\u4F1A\u540C\u65F6\u51FA\u73B0\u5728\u4EFB\u52A1\u5361\u7247\u5E95\u90E8\uFF0C\u5E76\u53EF\u4EE5\u4F5C\u4E3A\u7EDF\u8BA1\u8868\u4E2D\u7684\u5217\u3002\u4F8B\u5982\u201C\u5DF2\u5B8C\u6210\u521D\u6B65\u4FEE\u6539\u201D\u201C\u5DF2\u7ECF\u63D0\u4EA4\u4FEE\u6539\u201D\u3002",
      cls: "task-board-setting-hint"
    });
    const metricsContainer = container.createDiv({ cls: "task-board-setting-list" });
    this.taskBoardPlugin.data.settings.metrics.forEach((metric) => {
      this.renderMetricSetting(metricsContainer, metric);
    });
    new import_obsidian.Setting(container).addButton((button) => button.setButtonText("\uFF0B \u6DFB\u52A0\u4EFB\u52A1\u6307\u6807").onClick(async () => {
      const id = createId("metric");
      this.taskBoardPlugin.data.settings.metrics.push({ id, name: "\u65B0\u6307\u6807" });
      this.taskBoardPlugin.data.settings.statsColumns.push(id);
      await this.taskBoardPlugin.savePluginData();
      this.taskBoardPlugin.refreshViews();
      this.display();
    }));
    container.createEl("h3", { text: "\u7EDF\u8BA1\u8868\u5217" });
    container.createDiv({
      text: "\u9009\u62E9\u54EA\u4E9B\u7EF4\u5EA6\u51FA\u73B0\u5728\u7EDF\u8BA1\u8868\u4E2D\u3002",
      cls: "task-board-setting-hint"
    });
    const statColumns = [
      { id: "completed", name: "\u5DF2\u5B8C\u6210" },
      { id: "logCount", name: "\u65E5\u5FD7\u6570\u91CF" },
      { id: "tagCount", name: "\u6807\u7B7E\u6570\u91CF" },
      ...this.taskBoardPlugin.data.settings.metrics.map((metric) => ({ id: metric.id, name: metric.name }))
    ];
    statColumns.forEach((dimension) => {
      new import_obsidian.Setting(container).setName(dimension.name).addToggle((toggle) => toggle.setValue(this.taskBoardPlugin.data.settings.statsColumns.includes(dimension.id)).onChange(async (value) => {
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
    container.createEl("h3", { text: "\u5176\u4ED6" });
    new import_obsidian.Setting(container).setName("\u4EFB\u52A1\u6392\u5E8F\u8BF4\u660E").setDesc("\u4EFB\u52A1\u5361\u7247\u6309\u201C\u663E\u793A\u5728\u770B\u677F\u201D\u9009\u62E9\u7ED3\u679C\u6392\u5217\u3002");
  }
  renderPropertySetting(container, property) {
    const row = container.createDiv({ cls: "task-board-setting-item" });
    const nameInput = row.createEl("input", {
      type: "text",
      value: property.name,
      cls: "task-board-setting-inline-input"
    });
    const colorInput = row.createEl("input", {
      type: "color",
      value: property.color,
      cls: "task-board-setting-color"
    });
    const deleteButton = row.createEl("button", { text: "\u5220\u9664" });
    nameInput.addEventListener("change", () => {
      property.name = nameInput.value.trim() || "\u672A\u547D\u540D\u5C5E\u6027";
      void this.taskBoardPlugin.savePluginData().then(() => this.taskBoardPlugin.refreshViews());
    });
    colorInput.addEventListener("change", () => {
      property.color = colorInput.value;
      void this.taskBoardPlugin.savePluginData().then(() => this.taskBoardPlugin.refreshViews());
    });
    deleteButton.addEventListener("click", () => {
      var _a;
      if (this.taskBoardPlugin.data.settings.properties.length <= 1) {
        new import_obsidian.Notice("\u81F3\u5C11\u9700\u8981\u4FDD\u7559\u4E00\u4E2A\u4EFB\u52A1\u5C5E\u6027");
        return;
      }
      const fallbackId = (_a = this.taskBoardPlugin.data.settings.properties.find((item) => item.id !== property.id)) == null ? void 0 : _a.id;
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
  renderMetricSetting(container, metric) {
    const row = container.createDiv({ cls: "task-board-setting-item" });
    const nameInput = row.createEl("input", {
      type: "text",
      value: metric.name,
      cls: "task-board-setting-inline-input"
    });
    const deleteButton = row.createEl("button", { text: "\u5220\u9664" });
    nameInput.addEventListener("change", () => {
      metric.name = nameInput.value.trim() || "\u672A\u547D\u540D\u6307\u6807";
      void this.taskBoardPlugin.savePluginData().then(() => {
        this.taskBoardPlugin.refreshViews();
        this.display();
      });
    });
    deleteButton.addEventListener("click", () => {
      this.taskBoardPlugin.data.settings.metrics = this.taskBoardPlugin.data.settings.metrics.filter((item) => item.id !== metric.id);
      this.taskBoardPlugin.data.settings.statsColumns = this.taskBoardPlugin.data.settings.statsColumns.filter((id) => id !== metric.id);
      this.taskBoardPlugin.data.tasks.forEach((task) => delete task.metrics[metric.id]);
      void this.taskBoardPlugin.savePluginData().then(() => {
        this.taskBoardPlugin.refreshViews();
        this.display();
      });
    });
  }
};
var TaskBoardView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_TASK_BOARD;
  }
  getDisplayText() {
    return "\u4EFB\u52A1\u770B\u677F";
  }
  getIcon() {
    return "layout-dashboard";
  }
  async onOpen() {
    this.render();
  }
  async onClose() {
    this.contentEl.empty();
  }
  render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("task-board-view");
    const { columns, rows } = this.plugin.data.settings;
    const slotCount = Math.max(1, columns * rows);
    const cardCapacity = slotCount;
    const header = root.createDiv({ cls: "task-board-header" });
    const headerText = header.createDiv({ cls: "task-board-header-text" });
    headerText.createEl("h2", { text: "\u4EFB\u52A1\u770B\u677F", cls: "task-board-heading" });
    headerText.createDiv({
      text: `${this.plugin.data.tasks.length} \u4E2A\u4EFB\u52A1 \xB7 ${columns} \xD7 ${rows} \u770B\u677F`,
      cls: "task-board-subtitle"
    });
    const actions = header.createDiv({ cls: "task-board-header-actions" });
    const memoButton = actions.createEl("button", { text: "\u5907\u5FD8\u5F55", cls: "task-board-secondary-button" });
    memoButton.addEventListener("click", () => void this.plugin.activateView(VIEW_TYPE_MEMO));
    const statsButton = actions.createEl("button", { text: "\u7EDF\u8BA1", cls: "task-board-secondary-button" });
    statsButton.addEventListener("click", () => void this.plugin.activateView(VIEW_TYPE_STATS));
    const allTasksButton = actions.createEl("button", { text: "\u663E\u793A\u6240\u6709\u4EFB\u52A1", cls: "task-board-secondary-button" });
    allTasksButton.addEventListener("click", () => new AllTasksModal(this.app, this.plugin).open());
    const addButton = actions.createEl("button", { text: "+ \u65B0\u5EFA\u4EFB\u52A1", cls: "task-board-add-button" });
    addButton.addEventListener("click", () => void this.plugin.createAndOpenTask());
    const grid = root.createDiv({ cls: "task-board-grid" });
    grid.style.setProperty("--task-columns", String(columns));
    grid.style.setProperty("--task-rows", String(rows));
    grid.style.setProperty("--task-gap", `${this.plugin.data.settings.cardGap}px`);
    const visibleTasks = this.plugin.data.tasks.filter((task) => task.visibleOnBoard).slice(0, cardCapacity);
    visibleTasks.forEach((task) => this.renderTaskCard(grid, task));
    while (grid.children.length < cardCapacity) {
      grid.createDiv({ cls: "task-board-empty-cell" });
    }
  }
  renderTaskCard(container, task) {
    const property = getProperty(this.plugin.data.settings, task.propertyId);
    const card = container.createDiv({ cls: `task-card${task.completed ? " is-completed" : ""}` });
    card.style.setProperty("--task-color", property.color);
    card.style.setProperty("--task-bg-opacity", String(this.plugin.data.settings.backgroundOpacity / 100));
    card.style.setProperty("--task-bg-overlay", String(this.plugin.data.settings.backgroundOverlay / 100));
    card.style.setProperty("--task-bg-blur", `${this.plugin.data.settings.backgroundBlur}px`);
    const backgroundUrl = this.plugin.getTaskBackgroundUrl(task);
    if (backgroundUrl) {
      card.style.setProperty("--task-bg-image", `url("${backgroundUrl.replace(/"/g, '\\"')}")`);
      card.addClass("has-background-image");
    }
    const content = card.createDiv({ cls: "task-card-content" });
    const titleRow = content.createDiv({ cls: "task-card-title-row" });
    titleRow.createDiv({ cls: "task-card-type-dot" }).style.backgroundColor = property.color;
    titleRow.createDiv({ text: task.title, cls: "task-card-title" });
    titleRow.createDiv({ text: property.name, cls: "task-card-type-label" });
    if (task.tags.length > 0) {
      const tags = content.createDiv({ cls: "task-card-tags" });
      task.tags.slice(0, 4).forEach((tag) => tags.createSpan({ text: `#${tag}`, cls: "task-board-tag" }));
    }
    const logs = [...task.logs].sort((a, b) => b.editedAt - a.editedAt);
    const previewLogs = logs.slice(0, this.plugin.data.settings.cardLogCount);
    const logsContainer = content.createDiv({ cls: "task-card-logs" });
    if (previewLogs.length === 0) {
      logsContainer.createDiv({ text: "\u8FD8\u6CA1\u6709\u65E5\u5FD7", cls: "task-card-empty-log" });
    } else {
      previewLogs.forEach((log) => {
        const row = logsContainer.createDiv({ cls: "task-card-log" });
        row.createDiv({ text: shortDate(log.editedAt), cls: "task-card-log-time" });
        row.createDiv({ text: log.content, cls: "task-card-log-content" });
      });
    }
    const metrics = this.plugin.data.settings.metrics;
    if (metrics.length > 0) {
      const metricBox = content.createDiv({ cls: "task-card-metrics" });
      metrics.forEach((metric) => {
        const label = metricBox.createEl("label", { cls: "task-card-metric" });
        const checkbox = label.createEl("input", { type: "checkbox" });
        checkbox.checked = Boolean(task.metrics[metric.id]);
        label.createSpan({ text: metric.name });
        checkbox.addEventListener("click", (event) => event.stopPropagation());
        checkbox.addEventListener("change", () => {
          const current = this.plugin.getTask(task.id);
          if (!current) return;
          current.metrics[metric.id] = checkbox.checked;
          void this.plugin.saveTask(current).then(() => new import_obsidian.Notice(`\u6307\u6807\u201C${metric.name}\u201D\u5DF2\u66F4\u65B0`));
        });
      });
    }
    if (task.completed) {
      const footer = content.createDiv({ cls: "task-card-footer task-card-footer-compact" });
      footer.createSpan({ text: "\u5DF2\u5B8C\u6210", cls: "task-card-completed-badge" });
    }
    let didDrag = false;
    card.draggable = true;
    card.addEventListener("dragstart", (event) => {
      var _a;
      didDrag = true;
      card.addClass("is-dragging");
      (_a = event.dataTransfer) == null ? void 0 : _a.setData("text/task-board-task-id", task.id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      if (!card.classList.contains("is-dragging")) card.addClass("is-drag-over");
    });
    card.addEventListener("dragleave", () => card.removeClass("is-drag-over"));
    card.addEventListener("dragend", () => {
      card.removeClass("is-dragging");
      card.removeClass("is-drag-over");
    });
    card.addEventListener("drop", (event) => {
      var _a;
      event.preventDefault();
      card.removeClass("is-drag-over");
      const draggedId = (_a = event.dataTransfer) == null ? void 0 : _a.getData("text/task-board-task-id");
      if (draggedId) void this.plugin.reorderVisibleTasks(draggedId, task.id);
    });
    card.addEventListener("dragend", () => {
      card.removeClass("is-dragging");
      card.removeClass("is-drag-over");
      window.setTimeout(() => {
        didDrag = false;
      }, 250);
    });
    card.addEventListener("click", () => {
      if (didDrag) return;
      new TaskModal(this.app, this.plugin, task.id).open();
    });
  }
};
var TaskModal = class extends import_obsidian.Modal {
  constructor(app, plugin, taskId) {
    super(app);
    this.plugin = plugin;
    this.taskId = taskId;
  }
  onOpen() {
    this.applyBackdropBlur();
    this.modalEl.addClass("task-board-task-modal");
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  applyBackdropBlur() {
    var _a, _b;
    (_b = (_a = this.modalEl.parentElement) == null ? void 0 : _a.querySelector(".modal-bg")) == null ? void 0 : _b.classList.add("task-board-modal-backdrop");
  }
  render() {
    const task = this.plugin.getTask(this.taskId);
    const container = this.contentEl;
    container.empty();
    if (!task) {
      container.createDiv({ text: "\u4EFB\u52A1\u4E0D\u5B58\u5728\u3002" });
      return;
    }
    const property = getProperty(this.plugin.data.settings, task.propertyId);
    this.setTitle("\u7F16\u8F91\u4EFB\u52A1");
    let draftTitle = task.title;
    let draftPropertyId = task.propertyId;
    let draftTags = [...task.tags];
    const header = container.createDiv({ cls: "task-modal-header" });
    const titlePreview = header.createDiv({ text: task.title, cls: "task-modal-title-preview" });
    const metaPreview = header.createDiv({ text: `${property.name} \xB7 \u521B\u5EFA\u4E8E ${formatDate(task.createdAt)}`, cls: "task-modal-meta" });
    const editor = container.createDiv({ cls: "task-modal-editor-v2" });
    editor.createDiv({ text: "\u4EFB\u52A1\u540D\u79F0", cls: "task-modal-section-label" });
    const titleInput = editor.createEl("input", { type: "text", value: draftTitle, cls: "task-modal-title-input" });
    titleInput.addEventListener("input", () => {
      draftTitle = titleInput.value;
      titlePreview.setText(draftTitle.trim() || "\u672A\u547D\u540D\u4EFB\u52A1");
    });
    editor.createDiv({ text: "\u4EFB\u52A1\u5C5E\u6027", cls: "task-modal-section-label" });
    const propertySelect = editor.createEl("select", { cls: "task-modal-type-select" });
    this.plugin.data.settings.properties.forEach((item) => {
      const option = propertySelect.createEl("option", { value: item.id, text: item.name });
      option.selected = item.id === draftPropertyId;
    });
    propertySelect.addEventListener("change", () => {
      draftPropertyId = propertySelect.value;
      const selectedProperty = getProperty(this.plugin.data.settings, draftPropertyId);
      metaPreview.setText(`${selectedProperty.name} \xB7 \u521B\u5EFA\u4E8E ${formatDate(task.createdAt)}`);
    });
    const statusRow = editor.createDiv({ cls: "task-modal-status-row" });
    this.renderToggle(statusRow, "\u5DF2\u5B8C\u6210", task.completed, (value) => {
      const currentTask = this.plugin.getTask(this.taskId);
      if (!currentTask) return;
      currentTask.completed = value;
      void this.plugin.saveTask(currentTask);
    });
    this.renderToggle(statusRow, "\u663E\u793A\u5728\u4EFB\u52A1\u754C\u9762", task.visibleOnBoard, (value) => {
      const currentTask = this.plugin.getTask(this.taskId);
      if (!currentTask) return;
      currentTask.visibleOnBoard = value;
      void this.plugin.saveTask(currentTask);
    });
    editor.createDiv({ text: "\u4EFB\u52A1\u6807\u7B7E", cls: "task-modal-section-label" });
    const tagsBox = editor.createDiv({ cls: "task-modal-tag-options" });
    this.plugin.data.settings.tags.forEach((tag) => {
      const label = tagsBox.createEl("label", { cls: "task-modal-tag-option" });
      const checkbox = label.createEl("input", { type: "checkbox" });
      checkbox.checked = draftTags.includes(tag);
      label.createSpan({ text: tag });
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          if (!draftTags.includes(tag)) draftTags.push(tag);
        } else {
          draftTags = draftTags.filter((item) => item !== tag);
        }
      });
    });
    const saveButton = editor.createEl("button", { text: "\u4FDD\u5B58\u4FEE\u6539", cls: "mod-cta task-modal-save-button" });
    saveButton.addEventListener("click", () => {
      const currentTask = this.plugin.getTask(this.taskId);
      if (!currentTask) {
        new import_obsidian.Notice("\u4EFB\u52A1\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u4FDD\u5B58");
        return;
      }
      currentTask.title = draftTitle.trim() || "\u672A\u547D\u540D\u4EFB\u52A1";
      currentTask.propertyId = draftPropertyId;
      currentTask.tags = uniqueStrings(draftTags);
      void this.plugin.saveTask(currentTask).then(() => {
        new import_obsidian.Notice("\u4EFB\u52A1\u4FEE\u6539\u5DF2\u4FDD\u5B58");
        this.render();
      });
    });
    editor.createDiv({ text: "\u5361\u7247\u80CC\u666F\u56FE\u7247", cls: "task-modal-section-label" });
    editor.createDiv({
      text: "\u80CC\u666F\u56FE\u7247\u4F1A\u4FDD\u5B58\u5230\u5F53\u524D Vault \u7684 Task Board/Backgrounds \u6587\u4EF6\u5939\u3002\u8BBE\u7F6E\u4E2D\u7684\u900F\u660E\u5EA6\u3001\u6A21\u7CCA\u548C\u906E\u7F69\u5F3A\u5EA6\u4F1A\u5E94\u7528\u5230\u6240\u6709\u4EFB\u52A1\u5361\u7247\u3002",
      cls: "task-modal-section-hint"
    });
    const backgroundRow = editor.createDiv({ cls: "task-background-row" });
    const backgroundInput = backgroundRow.createEl("input", { type: "file", cls: "task-background-file-input" });
    backgroundInput.accept = "image/*";
    const chooseImageButton = backgroundRow.createEl("button", { text: task.backgroundImagePath ? "\u66F4\u6362\u80CC\u666F\u56FE\u7247" : "\u9009\u62E9\u672C\u5730\u56FE\u7247", cls: "task-modal-secondary-button" });
    chooseImageButton.addEventListener("click", () => backgroundInput.click());
    backgroundInput.addEventListener("change", () => {
      var _a;
      const file = (_a = backgroundInput.files) == null ? void 0 : _a[0];
      if (!file) return;
      void this.plugin.setTaskBackground(this.taskId, file).then(() => {
        new import_obsidian.Notice("\u4EFB\u52A1\u80CC\u666F\u56FE\u7247\u5DF2\u66F4\u65B0");
        this.render();
      });
    });
    if (task.backgroundImagePath) {
      const url = this.plugin.getTaskBackgroundUrl(task);
      if (url) {
        const preview = editor.createDiv({ cls: "task-background-preview" });
        preview.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;
      }
      const clearBackground = backgroundRow.createEl("button", { text: "\u79FB\u9664\u80CC\u666F", cls: "task-modal-danger-link" });
      clearBackground.addEventListener("click", () => {
        void this.plugin.clearTaskBackground(this.taskId).then(() => {
          new import_obsidian.Notice("\u80CC\u666F\u56FE\u7247\u5DF2\u79FB\u9664");
          this.render();
        });
      });
    }
    if (this.plugin.data.settings.metrics.length > 0) {
      const metricsHeader = container.createDiv({ cls: "task-modal-logs-header" });
      metricsHeader.createDiv({ text: "\u4EFB\u52A1\u6307\u6807", cls: "task-modal-section-title" });
      metricsHeader.createDiv({ text: "\u8FD9\u4E9B\u6307\u6807\u540C\u65F6\u53C2\u4E0E\u7EDF\u8BA1\u8868\u3002", cls: "task-modal-section-hint" });
      const metricsBox = container.createDiv({ cls: "task-modal-metrics-grid" });
      this.plugin.data.settings.metrics.forEach((metric) => {
        const label = metricsBox.createEl("label", { cls: "task-modal-metric-row" });
        const checkbox = label.createEl("input", { type: "checkbox" });
        checkbox.checked = Boolean(task.metrics[metric.id]);
        label.createSpan({ text: metric.name });
        checkbox.addEventListener("change", () => {
          task.metrics[metric.id] = checkbox.checked;
          void this.plugin.saveTask(task);
        });
      });
    }
    const logsHeader = container.createDiv({ cls: "task-modal-logs-header" });
    logsHeader.createDiv({ text: "\u4EFB\u52A1\u65E5\u5FD7", cls: "task-modal-section-title" });
    logsHeader.createDiv({ text: "\u6309\u6700\u8FD1\u7F16\u8F91\u65F6\u95F4\u5012\u5E8F\u6392\u5217", cls: "task-modal-section-hint" });
    const logs = container.createDiv({ cls: "task-modal-logs" });
    const sortedLogs = [...task.logs].sort((a, b) => b.editedAt - a.editedAt);
    if (sortedLogs.length === 0) {
      logs.createDiv({ text: "\u6682\u65E0\u65E5\u5FD7\u3002", cls: "task-modal-empty-logs" });
    }
    sortedLogs.forEach((log) => this.renderLog(logs, log));
    const addLogBox = container.createDiv({ cls: "task-modal-add-log" });
    addLogBox.createDiv({ text: "\u65B0\u589E\u65E5\u5FD7", cls: "task-modal-section-label" });
    const newLogTextarea = addLogBox.createEl("textarea", {
      cls: "task-modal-log-input",
      placeholder: "\u8BB0\u5F55\u8FD9\u6B21\u8FDB\u5C55\u2026\u2026"
    });
    const addLogButton = addLogBox.createEl("button", { text: "\u6DFB\u52A0\u65E5\u5FD7", cls: "task-modal-secondary-button" });
    addLogButton.addEventListener("click", () => {
      const content = newLogTextarea.value.trim();
      if (!content) return new import_obsidian.Notice("\u8BF7\u5148\u8F93\u5165\u65E5\u5FD7\u5185\u5BB9");
      const now = Date.now();
      const currentTask = this.plugin.getTask(this.taskId);
      if (!currentTask) return;
      currentTask.logs.push({ id: createId("log"), content, editedAt: now });
      currentTask.updatedAt = now;
      void this.plugin.saveTask(currentTask).then(() => {
        new import_obsidian.Notice("\u65E5\u5FD7\u5DF2\u6DFB\u52A0");
        this.render();
      });
    });
    const bottom = container.createDiv({ cls: "task-modal-bottom-actions" });
    const deleteButton = bottom.createEl("button", { text: "\u5220\u9664\u4EFB\u52A1", cls: "task-modal-danger-button" });
    deleteButton.addEventListener("click", () => {
      if (!window.confirm(`\u786E\u5B9A\u5220\u9664\u201C${task.title}\u201D\u5417\uFF1F`)) return;
      void this.plugin.deleteTask(this.taskId).then(() => this.close());
    });
  }
  renderToggle(container, text, value, onChange) {
    const label = container.createEl("label", { cls: "task-modal-status-toggle" });
    const checkbox = label.createEl("input", { type: "checkbox" });
    checkbox.checked = value;
    label.createSpan({ text });
    checkbox.addEventListener("change", () => onChange(checkbox.checked));
  }
  renderLog(container, log) {
    const row = container.createDiv({ cls: "task-modal-log-row" });
    const meta = row.createDiv({ cls: "task-modal-log-meta" });
    meta.createDiv({ text: formatDate(log.editedAt), cls: "task-modal-log-time" });
    const textarea = row.createEl("textarea", { cls: "task-modal-log-textarea" });
    textarea.value = log.content;
    const actions = row.createDiv({ cls: "task-modal-log-actions" });
    const saveButton = actions.createEl("button", { text: "\u4FDD\u5B58\u4FEE\u6539", cls: "task-modal-secondary-button" });
    const deleteButton = actions.createEl("button", { text: "\u5220\u9664\u65E5\u5FD7", cls: "task-modal-danger-link" });
    saveButton.addEventListener("click", () => {
      const task = this.plugin.getTask(this.taskId);
      if (!task) return;
      const currentLog = task.logs.find((item) => item.id === log.id);
      if (!currentLog) return;
      const content = textarea.value.trim();
      if (!content) return new import_obsidian.Notice("\u65E5\u5FD7\u4E0D\u80FD\u4E3A\u7A7A");
      currentLog.content = content;
      currentLog.editedAt = Date.now();
      task.updatedAt = Date.now();
      void this.plugin.saveTask(task).then(() => {
        new import_obsidian.Notice("\u65E5\u5FD7\u5DF2\u4FDD\u5B58");
        this.render();
      });
    });
    deleteButton.addEventListener("click", () => {
      if (!window.confirm("\u5220\u9664\u8FD9\u6761\u65E5\u5FD7\u5417\uFF1F")) return;
      const task = this.plugin.getTask(this.taskId);
      if (!task) return;
      task.logs = task.logs.filter((item) => item.id !== log.id);
      void this.plugin.saveTask(task).then(() => this.render());
    });
  }
};
var AllTasksModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    this.applyBackdropBlur();
    this.modalEl.addClass("task-board-all-tasks-modal");
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  applyBackdropBlur() {
    var _a, _b;
    (_b = (_a = this.modalEl.parentElement) == null ? void 0 : _a.querySelector(".modal-bg")) == null ? void 0 : _b.classList.add("task-board-modal-backdrop");
  }
  render() {
    const container = this.contentEl;
    container.empty();
    this.setTitle("\u663E\u793A\u6240\u6709\u4EFB\u52A1");
    const search = container.createEl("input", {
      type: "search",
      placeholder: "\u641C\u7D22\u4EFB\u52A1\u540D\u79F0\u3001\u5C5E\u6027\u3001\u6807\u7B7E\u2026\u2026",
      cls: "task-board-task-search"
    });
    const list = container.createDiv({ cls: "task-all-list" });
    const draw = () => {
      list.empty();
      const keyword = search.value.trim().toLowerCase();
      const tasks = this.plugin.data.tasks.filter((task) => {
        if (!keyword) return true;
        const property = getProperty(this.plugin.data.settings, task.propertyId);
        return [task.title, property.name, ...task.tags].join(" ").toLowerCase().includes(keyword);
      });
      const active = tasks.filter((task) => !task.completed);
      const completed = tasks.filter((task) => task.completed);
      this.renderSection(list, "\u4EFB\u52A1", active);
      this.renderSection(list, "\u5DF2\u5B8C\u6210\u4EFB\u52A1", completed);
    };
    search.addEventListener("input", draw);
    draw();
  }
  renderSection(container, title, tasks) {
    const section = container.createDiv({ cls: "task-all-section" });
    section.createDiv({ text: `${title} \xB7 ${tasks.length}`, cls: "task-all-section-title" });
    if (tasks.length === 0) {
      section.createDiv({ text: "\u6CA1\u6709\u4EFB\u52A1\u3002", cls: "task-modal-empty-logs" });
      return;
    }
    tasks.forEach((task) => {
      const property = getProperty(this.plugin.data.settings, task.propertyId);
      const row = section.createDiv({ cls: "task-all-row" });
      row.style.setProperty("--task-color", property.color);
      const main = row.createDiv({ cls: "task-all-row-main" });
      main.createDiv({ text: task.title, cls: "task-all-row-title" });
      const meta = main.createDiv({ cls: "task-all-row-meta" });
      meta.createSpan({ text: property.name });
      task.tags.forEach((tag) => meta.createSpan({ text: `#${tag}`, cls: "task-board-tag" }));
      if (task.completed) meta.createSpan({ text: "\u5DF2\u5B8C\u6210", cls: "task-card-completed-badge" });
      const updated = main.createDiv({ text: `\u6700\u8FD1\u7F16\u8F91 ${formatDate(task.updatedAt)}`, cls: "task-all-row-time" });
      const showLabel = row.createEl("label", { cls: "task-all-show-control" });
      showLabel.createSpan({ text: "\u663E\u793A" });
      const checkbox = showLabel.createEl("input", { type: "checkbox" });
      checkbox.checked = task.visibleOnBoard;
      checkbox.addEventListener("click", (event) => event.stopPropagation());
      checkbox.addEventListener("change", () => {
        task.visibleOnBoard = checkbox.checked;
        void this.plugin.saveTask(task).then(() => this.render());
      });
      row.addEventListener("click", (event) => {
        const target = event.target;
        if (target === checkbox || target.closest(".task-all-show-control")) return;
        this.close();
        new TaskModal(this.app, this.plugin, task.id).open();
      });
    });
  }
};
var MemoView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    __publicField(this, "selectedTopicId", "");
  }
  getViewType() {
    return VIEW_TYPE_MEMO;
  }
  getDisplayText() {
    return "\u5907\u5FD8\u5F55";
  }
  getIcon() {
    return "notebook-pen";
  }
  async onOpen() {
    this.render();
  }
  async onClose() {
    this.contentEl.empty();
  }
  render() {
    var _a;
    const root = this.contentEl;
    root.empty();
    root.addClass("task-memo-view");
    const header = root.createDiv({ cls: "task-board-header" });
    const headerText = header.createDiv({ cls: "task-board-header-text" });
    headerText.createEl("h2", { text: "\u5907\u5FD8\u5F55", cls: "task-board-heading" });
    headerText.createDiv({ text: "\u4E3B\u9898 \u2192 \u591A\u4E2A\u7B14\u8BB0", cls: "task-board-subtitle" });
    const actions = header.createDiv({ cls: "task-board-header-actions" });
    const addTopic = actions.createEl("button", { text: "+ \u6DFB\u52A0\u4E3B\u9898", cls: "task-board-secondary-button" });
    addTopic.addEventListener("click", () => {
      new TextInputModal(this.app, "\u6DFB\u52A0\u4E3B\u9898", "\u8F93\u5165\u4E3B\u9898\u540D\u79F0", async (value) => {
        if (!value) return;
        const now = Date.now();
        const topic2 = { id: createId("topic"), order: this.plugin.data.memoTopics.length, title: value, pinned: false, notes: [], createdAt: now, updatedAt: now };
        this.plugin.data.memoTopics.push(topic2);
        this.selectedTopicId = topic2.id;
        await this.plugin.savePluginData();
        this.render();
      }).open();
    });
    const layout = root.createDiv({ cls: "task-memo-layout" });
    const topicsPane = layout.createDiv({ cls: "task-memo-topics" });
    topicsPane.createDiv({ text: "\u4E3B\u9898", cls: "task-memo-pane-title" });
    if (this.plugin.data.memoTopics.length === 0) {
      topicsPane.createDiv({ text: "\u8FD8\u6CA1\u6709\u4E3B\u9898\u3002", cls: "task-modal-empty-logs" });
    }
    const sortedTopics = [...this.plugin.data.memoTopics].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.order - b.order;
    });
    sortedTopics.forEach((topic2) => {
      const row = topicsPane.createDiv({ cls: `task-memo-topic-row${topic2.id === this.selectedTopicId ? " is-selected" : ""}${topic2.pinned ? " is-pinned" : ""}` });
      let didDrag = false;
      const titleRow = row.createDiv({ cls: "task-memo-topic-title-row" });
      titleRow.createDiv({ text: topic2.title, cls: "task-memo-topic-title" });
      if (topic2.pinned) titleRow.createSpan({ text: "\u{1F4CC}", cls: "task-memo-topic-pin" });
      row.createDiv({ text: `${topic2.notes.length} \u6761\u7B14\u8BB0`, cls: "task-memo-topic-count" });
      row.addEventListener("click", () => {
        if (didDrag) return;
        this.selectedTopicId = topic2.id;
        this.render();
      });
      row.draggable = true;
      row.addEventListener("dragstart", (event) => {
        var _a2;
        event.stopPropagation();
        didDrag = true;
        row.addClass("is-dragging");
        (_a2 = event.dataTransfer) == null ? void 0 : _a2.setData("text/task-board-topic-id", topic2.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });
      row.addEventListener("dragover", (event) => {
        var _a2;
        const draggedId = (_a2 = event.dataTransfer) == null ? void 0 : _a2.types.includes("text/task-board-topic-id");
        if (!draggedId) return;
        event.preventDefault();
        row.addClass("is-drag-over");
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      });
      row.addEventListener("dragleave", () => row.removeClass("is-drag-over"));
      row.addEventListener("dragend", () => {
        row.removeClass("is-dragging");
        row.removeClass("is-drag-over");
        window.setTimeout(() => {
          didDrag = false;
        }, 250);
      });
      row.addEventListener("drop", (event) => {
        var _a2;
        event.preventDefault();
        event.stopPropagation();
        row.removeClass("is-drag-over");
        const draggedId = (_a2 = event.dataTransfer) == null ? void 0 : _a2.getData("text/task-board-topic-id");
        if (draggedId) void this.plugin.reorderMemoTopics(draggedId, topic2.id);
      });
      row.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.showTopicContextMenu(event, topic2);
      });
    });
    let topic = this.plugin.data.memoTopics.find((item) => item.id === this.selectedTopicId);
    if (!topic) topic = this.plugin.data.memoTopics[0];
    if (topic) this.selectedTopicId = topic.id;
    const notesPane = layout.createDiv({ cls: "task-memo-notes" });
    const noteHeader = notesPane.createDiv({ cls: "task-memo-notes-header" });
    noteHeader.createDiv({ text: (_a = topic == null ? void 0 : topic.title) != null ? _a : "\u8BF7\u9009\u62E9\u4E3B\u9898", cls: "task-memo-pane-title" });
    const addNote = noteHeader.createEl("button", { text: "+ \u6DFB\u52A0\u7B14\u8BB0", cls: "task-board-secondary-button" });
    addNote.disabled = !topic;
    addNote.addEventListener("click", () => {
      if (!topic) return;
      const now = Date.now();
      const note = { id: createId("note"), order: 0, content: "", createdAt: now, updatedAt: now };
      note.order = topic.notes.length;
      topic.notes.push(note);
      topic.updatedAt = now;
      void this.plugin.savePluginData().then(() => {
        this.render();
        new MemoNoteModal(this.app, this.plugin, topic.id, note.id).open();
      });
    });
    if (topic) {
      const noteList = notesPane.createDiv({ cls: "task-memo-note-list" });
      [...topic.notes].sort((a, b) => a.order - b.order).forEach((note) => {
        var _a2, _b;
        const card = noteList.createDiv({ cls: "task-memo-note-card" });
        let didDrag = false;
        const firstLine = (_b = (_a2 = note.content.trim().split(/\r?\n/).find((line) => line.trim())) == null ? void 0 : _a2.trim()) != null ? _b : "";
        card.createDiv({ text: firstLine ? firstLine.slice(0, 40) : "\u65B0\u7B14\u8BB0", cls: "task-memo-note-title" });
        card.createDiv({ text: note.content || "\u8FD8\u6CA1\u6709\u5185\u5BB9\u3002", cls: "task-memo-note-preview" });
        card.createDiv({ text: `\u521B\u5EFA\u4E8E ${formatDate(note.createdAt)} \xB7 \u7F16\u8F91\u4E8E ${formatDate(note.updatedAt)}`, cls: "task-memo-note-time" });
        card.addEventListener("click", () => {
          if (didDrag) return;
          new MemoNoteModal(this.app, this.plugin, topic.id, note.id).open();
        });
        card.draggable = true;
        card.addEventListener("dragstart", (event) => {
          var _a3, _b2;
          event.stopPropagation();
          didDrag = true;
          card.addClass("is-dragging");
          (_a3 = event.dataTransfer) == null ? void 0 : _a3.setData("text/task-board-note-id", note.id);
          (_b2 = event.dataTransfer) == null ? void 0 : _b2.setData("text/task-board-topic-id", topic.id);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        });
        card.addEventListener("dragover", (event) => {
          var _a3;
          if (!((_a3 = event.dataTransfer) == null ? void 0 : _a3.types.includes("text/task-board-note-id"))) return;
          event.preventDefault();
          card.addClass("is-drag-over");
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        });
        card.addEventListener("dragleave", () => card.removeClass("is-drag-over"));
        card.addEventListener("dragend", () => {
          card.removeClass("is-dragging");
          card.removeClass("is-drag-over");
          window.setTimeout(() => {
            didDrag = false;
          }, 250);
        });
        card.addEventListener("drop", (event) => {
          var _a3, _b2;
          event.preventDefault();
          event.stopPropagation();
          card.removeClass("is-drag-over");
          const draggedId = (_a3 = event.dataTransfer) == null ? void 0 : _a3.getData("text/task-board-note-id");
          const sourceTopicId = (_b2 = event.dataTransfer) == null ? void 0 : _b2.getData("text/task-board-topic-id");
          if (draggedId && sourceTopicId === topic.id) {
            void this.plugin.reorderMemoNotes(topic.id, draggedId, note.id);
          }
        });
        card.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.showNoteContextMenu(event, topic, note);
        });
      });
    } else {
      notesPane.createDiv({ text: "\u5148\u521B\u5EFA\u4E00\u4E2A\u4E3B\u9898\u3002", cls: "task-memo-empty" });
    }
  }
  showTopicContextMenu(event, topic) {
    const menu = new import_obsidian.Menu();
    menu.addItem((item) => {
      item.setTitle(topic.pinned ? "\u53D6\u6D88\u56FA\u5B9A" : "Pin / \u56FA\u5B9A").onClick(async () => {
        topic.pinned = !topic.pinned;
        topic.updatedAt = Date.now();
        await this.plugin.savePluginData();
        this.render();
      });
    });
    menu.addItem((item) => {
      item.setTitle("\u91CD\u547D\u540D").onClick(() => {
        new TextInputModal(
          this.app,
          "\u91CD\u547D\u540D\u4E3B\u9898",
          "\u8F93\u5165\u65B0\u7684\u4E3B\u9898\u540D\u79F0",
          async (value) => {
            topic.title = value;
            topic.updatedAt = Date.now();
            await this.plugin.savePluginData();
            this.render();
          }
        ).open();
      });
    });
    menu.addItem((item) => {
      item.setTitle("\u6DFB\u52A0\u7B14\u8BB0").onClick(() => {
        const now = Date.now();
        const note = { id: createId("note"), order: 0, content: "", createdAt: now, updatedAt: now };
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
      item.setTitle("\u5220\u9664\u4E3B\u9898").onClick(async () => {
        const ok = window.confirm(`\u786E\u5B9A\u5220\u9664\u4E3B\u9898\u201C${topic.title}\u201D\u53CA\u5176\u4E2D\u7684 ${topic.notes.length} \u6761\u7B14\u8BB0\u5417\uFF1F`);
        if (!ok) return;
        this.plugin.data.memoTopics = this.plugin.data.memoTopics.filter((item2) => item2.id !== topic.id);
        if (this.selectedTopicId === topic.id) this.selectedTopicId = "";
        await this.plugin.savePluginData();
        this.render();
        new import_obsidian.Notice("\u4E3B\u9898\u5DF2\u5220\u9664");
      });
    });
    menu.showAtMouseEvent(event);
  }
  showNoteContextMenu(event, topic, note) {
    const menu = new import_obsidian.Menu();
    menu.addItem((item) => {
      item.setTitle("\u7F16\u8F91\u7B14\u8BB0").onClick(() => new MemoNoteModal(this.app, this.plugin, topic.id, note.id).open());
    });
    menu.addItem((item) => {
      item.setTitle("\u5220\u9664\u7B14\u8BB0").onClick(async () => {
        const ok = window.confirm("\u786E\u5B9A\u5220\u9664\u8FD9\u6761\u7B14\u8BB0\u5417\uFF1F");
        if (!ok) return;
        topic.notes = topic.notes.filter((item2) => item2.id !== note.id);
        topic.updatedAt = Date.now();
        await this.plugin.savePluginData();
        this.render();
        new import_obsidian.Notice("\u7B14\u8BB0\u5DF2\u5220\u9664");
      });
    });
    menu.showAtMouseEvent(event);
  }
};
var MemoNoteModal = class extends import_obsidian.Modal {
  constructor(app, plugin, topicId, noteId) {
    super(app);
    this.plugin = plugin;
    this.topicId = topicId;
    this.noteId = noteId;
  }
  onOpen() {
    this.applyBackdropBlur();
    this.modalEl.addClass("task-board-memo-note-modal");
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  applyBackdropBlur() {
    var _a, _b;
    (_b = (_a = this.modalEl.parentElement) == null ? void 0 : _a.querySelector(".modal-bg")) == null ? void 0 : _b.classList.add("task-board-modal-backdrop");
  }
  render() {
    const topic = this.plugin.data.memoTopics.find((item) => item.id === this.topicId);
    const note = topic == null ? void 0 : topic.notes.find((item) => item.id === this.noteId);
    if (!topic || !note) {
      this.contentEl.setText("\u7B14\u8BB0\u4E0D\u5B58\u5728\u3002");
      return;
    }
    this.contentEl.empty();
    this.setTitle("\u7F16\u8F91\u7B14\u8BB0");
    this.contentEl.createDiv({ text: topic.title, cls: "task-modal-meta" });
    const textarea = this.contentEl.createEl("textarea", { cls: "task-memo-note-editor", placeholder: "\u8BB0\u5F55\u4F60\u7684\u60F3\u6CD5\u2026\u2026" });
    textarea.value = note.content;
    const meta = this.contentEl.createDiv({ text: `\u521B\u5EFA\u4E8E ${formatDate(note.createdAt)} \xB7 \u4E0A\u6B21\u7F16\u8F91 ${formatDate(note.updatedAt)}`, cls: "task-modal-meta" });
    const actions = this.contentEl.createDiv({ cls: "task-modal-bottom-actions" });
    const save = actions.createEl("button", { text: "\u4FDD\u5B58", cls: "mod-cta" });
    save.addEventListener("click", () => {
      note.content = textarea.value;
      note.updatedAt = Date.now();
      topic.updatedAt = note.updatedAt;
      void this.plugin.savePluginData().then(() => {
        this.plugin.refreshViews();
        new import_obsidian.Notice("\u7B14\u8BB0\u5DF2\u4FDD\u5B58");
        meta.setText(`\u521B\u5EFA\u4E8E ${formatDate(note.createdAt)} \xB7 \u4E0A\u6B21\u7F16\u8F91 ${formatDate(note.updatedAt)}`);
      });
    });
  }
};
var TextInputModal = class extends import_obsidian.Modal {
  constructor(app, title, placeholder, onSubmit) {
    super(app);
    this.title = title;
    this.placeholder = placeholder;
    this.onSubmit = onSubmit;
  }
  onOpen() {
    this.setTitle(this.title);
    const input = this.contentEl.createEl("input", { type: "text", placeholder: this.placeholder });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void this.submit(input.value);
      }
    });
    const actions = this.contentEl.createDiv({ cls: "task-modal-bottom-actions" });
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88" });
    const ok = actions.createEl("button", { text: "\u786E\u5B9A", cls: "mod-cta" });
    cancel.addEventListener("click", () => this.close());
    ok.addEventListener("click", () => void this.submit(input.value));
    window.setTimeout(() => input.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
  }
  async submit(value) {
    const clean = value.trim();
    if (!clean) {
      new import_obsidian.Notice("\u8BF7\u8F93\u5165\u5185\u5BB9");
      return;
    }
    await this.onSubmit(clean);
    this.close();
  }
};
var StatsView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_STATS;
  }
  getDisplayText() {
    return "\u4EFB\u52A1\u7EDF\u8BA1";
  }
  getIcon() {
    return "table-properties";
  }
  async onOpen() {
    this.render();
  }
  async onClose() {
    this.contentEl.empty();
  }
  render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("task-stats-view");
    const header = root.createDiv({ cls: "task-board-header" });
    const headerText = header.createDiv({ cls: "task-board-header-text" });
    headerText.createEl("h2", { text: "\u4EFB\u52A1\u7EDF\u8BA1", cls: "task-board-heading" });
    headerText.createDiv({ text: "\u7EDF\u8BA1\u7EF4\u5EA6\u6765\u81EA\u8BBE\u7F6E\u4E2D\u7684\u5185\u7F6E\u7EF4\u5EA6\u548C\u81EA\u5B9A\u4E49\u4EFB\u52A1\u6307\u6807\u3002", cls: "task-board-subtitle" });
    const settingsButton = header.createEl("button", { text: "\u6253\u5F00\u8BBE\u7F6E", cls: "task-board-secondary-button" });
    settingsButton.addEventListener("click", () => {
      new import_obsidian.Notice("\u8BF7\u6253\u5F00 \u8BBE\u7F6E \u2192 \u7B2C\u4E09\u65B9\u63D2\u4EF6 \u2192 Task Board");
    });
    const dimensions = this.getDimensions();
    const table = root.createEl("table", { cls: "task-stats-table" });
    const thead = table.createEl("thead");
    const headRow = thead.createEl("tr");
    headRow.createEl("th", { text: "\u4EFB\u52A1" });
    dimensions.forEach((dimension) => headRow.createEl("th", { text: dimension.name }));
    const tbody = table.createEl("tbody");
    this.plugin.data.tasks.forEach((task) => {
      const tr = tbody.createEl("tr");
      const taskCell = tr.createEl("td", { cls: "task-stats-task-cell" });
      const property = getProperty(this.plugin.data.settings, task.propertyId);
      taskCell.createDiv({ text: task.title, cls: "task-stats-task-name" });
      taskCell.createDiv({ text: `${property.name}${task.completed ? " \xB7 \u5DF2\u5B8C\u6210" : ""}`, cls: "task-stats-task-meta" });
      dimensions.forEach((dimension) => {
        const td = tr.createEl("td", { cls: "task-stats-value-cell" });
        if (dimension.id === "completed") td.setText(task.completed ? "\u2713" : "\u2014");
        else if (dimension.id === "logCount") td.setText(String(task.logs.length));
        else if (dimension.id === "tagCount") td.setText(String(task.tags.length));
        else td.setText(task.metrics[dimension.id] ? "\u2713" : "\u2014");
      });
    });
    if (this.plugin.data.tasks.length === 0) {
      const tr = tbody.createEl("tr");
      const td = tr.createEl("td", { text: "\u6682\u65E0\u4EFB\u52A1\u3002" });
      td.colSpan = dimensions.length + 1;
    }
  }
  getDimensions() {
    const map = /* @__PURE__ */ new Map([
      ["completed", "\u5DF2\u5B8C\u6210"],
      ["logCount", "\u65E5\u5FD7\u6570\u91CF"],
      ["tagCount", "\u6807\u7B7E\u6570\u91CF"]
    ]);
    this.plugin.data.settings.metrics.forEach((metric) => map.set(metric.id, metric.name));
    return this.plugin.data.settings.statsColumns.map((id) => {
      var _a;
      return { id, name: (_a = map.get(id)) != null ? _a : id };
    }).filter((dimension, index, array) => array.findIndex((item) => item.id === dimension.id) === index);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBJdGVtVmlldyxcbiAgTWVudSxcbiAgTW9kYWwsXG4gIE5vdGljZSxcbiAgUGx1Z2luLFxuICBQbHVnaW5TZXR0aW5nVGFiLFxuICBTZXR0aW5nLFxuICBURmlsZSxcbiAgV29ya3NwYWNlTGVhZixcbiAgbm9ybWFsaXplUGF0aCxcbn0gZnJvbSAnb2JzaWRpYW4nO1xuXG5leHBvcnQgY29uc3QgVklFV19UWVBFX1RBU0tfQk9BUkQgPSAndGFzay1ib2FyZC12aWV3JztcbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfTUVNTyA9ICd0YXNrLWJvYXJkLW1lbW8tdmlldyc7XG5leHBvcnQgY29uc3QgVklFV19UWVBFX1NUQVRTID0gJ3Rhc2stYm9hcmQtc3RhdHMtdmlldyc7XG5cbmludGVyZmFjZSBUYXNrUHJvcGVydHlEZWYge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbG9yOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUYXNrTWV0cmljRGVmIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVGFza0xvZyB7XG4gIGlkOiBzdHJpbmc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgZWRpdGVkQXQ6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFRhc2sge1xuICBpZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBwcm9wZXJ0eUlkOiBzdHJpbmc7XG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBtZXRyaWNzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPjtcbiAgbG9nczogVGFza0xvZ1tdO1xuICBjcmVhdGVkQXQ6IG51bWJlcjtcbiAgdXBkYXRlZEF0OiBudW1iZXI7XG4gIGNvbXBsZXRlZDogYm9vbGVhbjtcbiAgdmlzaWJsZU9uQm9hcmQ6IGJvb2xlYW47XG4gIGJhY2tncm91bmRJbWFnZVBhdGg/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBNZW1vTm90ZSB7XG4gIGlkOiBzdHJpbmc7XG4gIG9yZGVyOiBudW1iZXI7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBudW1iZXI7XG4gIHVwZGF0ZWRBdDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgTWVtb1RvcGljIHtcbiAgaWQ6IHN0cmluZztcbiAgb3JkZXI6IG51bWJlcjtcbiAgdGl0bGU6IHN0cmluZztcbiAgcGlubmVkOiBib29sZWFuO1xuICBub3RlczogTWVtb05vdGVbXTtcbiAgY3JlYXRlZEF0OiBudW1iZXI7XG4gIHVwZGF0ZWRBdDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgVGFza0JvYXJkU2V0dGluZ3Mge1xuICBjb2x1bW5zOiBudW1iZXI7XG4gIHJvd3M6IG51bWJlcjtcbiAgY2FyZExvZ0NvdW50OiBudW1iZXI7XG4gIGNhcmRHYXA6IG51bWJlcjtcbiAgYmFja2dyb3VuZE9wYWNpdHk6IG51bWJlcjtcbiAgYmFja2dyb3VuZE92ZXJsYXk6IG51bWJlcjtcbiAgYmFja2dyb3VuZEJsdXI6IG51bWJlcjtcbiAgcHJvcGVydGllczogVGFza1Byb3BlcnR5RGVmW107XG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBtZXRyaWNzOiBUYXNrTWV0cmljRGVmW107XG4gIHN0YXRzQ29sdW1uczogc3RyaW5nW107XG59XG5cbmludGVyZmFjZSBTdG9yZWREYXRhIHtcbiAgdGFza3M6IFRhc2tbXTtcbiAgc2V0dGluZ3M6IFRhc2tCb2FyZFNldHRpbmdzO1xuICBtZW1vVG9waWNzOiBNZW1vVG9waWNbXTtcbn1cblxuY29uc3QgREVGQVVMVF9QUk9QRVJUSUVTOiBUYXNrUHJvcGVydHlEZWZbXSA9IFtcbiAgeyBpZDogJ3dvcmsnLCBuYW1lOiAnXHU1REU1XHU0RjVDJywgY29sb3I6ICcjM2I4MmY2JyB9LFxuICB7IGlkOiAnc3R1ZHknLCBuYW1lOiAnXHU1QjY2XHU0RTYwJywgY29sb3I6ICcjMjJjNTVlJyB9LFxuICB7IGlkOiAncGVyc29uYWwnLCBuYW1lOiAnXHU0RTJBXHU0RUJBJywgY29sb3I6ICcjZjU5ZTBiJyB9LFxuICB7IGlkOiAncHJvamVjdCcsIG5hbWU6ICdcdTk4NzlcdTc2RUUnLCBjb2xvcjogJyNhODU1ZjcnIH0sXG4gIHsgaWQ6ICdvdGhlcicsIG5hbWU6ICdcdTUxNzZcdTRFRDYnLCBjb2xvcjogJyM2NDc0OGInIH0sXG5dO1xuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBUYXNrQm9hcmRTZXR0aW5ncyA9IHtcbiAgY29sdW1uczogMyxcbiAgcm93czogMyxcbiAgY2FyZExvZ0NvdW50OiAzLFxuICBjYXJkR2FwOiAxMixcbiAgYmFja2dyb3VuZE9wYWNpdHk6IDIyLFxuICBiYWNrZ3JvdW5kT3ZlcmxheTogMjQsXG4gIGJhY2tncm91bmRCbHVyOiAwLFxuICBwcm9wZXJ0aWVzOiBERUZBVUxUX1BST1BFUlRJRVMsXG4gIHRhZ3M6IFsnXHU5MUNEXHU4OTgxJywgJ1x1N0QyN1x1NjAyNScsICdcdTk1N0ZcdTY3MUYnLCAnXHU1REU1XHU0RjVDXHU2NUU1XHU1RTM4J10sXG4gIG1ldHJpY3M6IFtcbiAgICB7IGlkOiAnZmlyc3QtZWRpdCcsIG5hbWU6ICdcdTVERjJcdTVCOENcdTYyMTBcdTUyMURcdTZCNjVcdTRGRUVcdTY1MzknIH0sXG4gICAgeyBpZDogJ3N1Ym1pdHRlZCcsIG5hbWU6ICdcdTVERjJcdTdFQ0ZcdTYzRDBcdTRFQTRcdTRGRUVcdTY1MzknIH0sXG4gIF0sXG4gIHN0YXRzQ29sdW1uczogWydjb21wbGV0ZWQnLCAnbG9nQ291bnQnLCAnZmlyc3QtZWRpdCcsICdzdWJtaXR0ZWQnXSxcbn07XG5cbmZ1bmN0aW9uIGNsb25lRGVmYXVsdHMoKTogVGFza0JvYXJkU2V0dGluZ3Mge1xuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShERUZBVUxUX1NFVFRJTkdTKSkgYXMgVGFza0JvYXJkU2V0dGluZ3M7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUlkKHByZWZpeDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3ByZWZpeH0tJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDkpfWA7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdERhdGUodGltZXN0YW1wOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ3poLUNOJywge1xuICAgIHllYXI6ICdudW1lcmljJyxcbiAgICBtb250aDogJzItZGlnaXQnLFxuICAgIGRheTogJzItZGlnaXQnLFxuICAgIGhvdXI6ICcyLWRpZ2l0JyxcbiAgICBtaW51dGU6ICcyLWRpZ2l0JyxcbiAgfSkuZm9ybWF0KG5ldyBEYXRlKHRpbWVzdGFtcCkpO1xufVxuXG5mdW5jdGlvbiBzaG9ydERhdGUodGltZXN0YW1wOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ3poLUNOJywge1xuICAgIG1vbnRoOiAnMi1kaWdpdCcsXG4gICAgZGF5OiAnMi1kaWdpdCcsXG4gICAgaG91cjogJzItZGlnaXQnLFxuICAgIG1pbnV0ZTogJzItZGlnaXQnLFxuICB9KS5mb3JtYXQobmV3IERhdGUodGltZXN0YW1wKSk7XG59XG5cbmZ1bmN0aW9uIHNhZmVQb3NpdGl2ZUludCh2YWx1ZTogbnVtYmVyLCBmYWxsYmFjazogbnVtYmVyLCBtaW4gPSAxLCBtYXggPSAxMik6IG51bWJlciB7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKHZhbHVlKSkgcmV0dXJuIGZhbGxiYWNrO1xuICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIE1hdGgucm91bmQodmFsdWUpKSk7XG59XG5cbmZ1bmN0aW9uIHVuaXF1ZVN0cmluZ3ModmFsdWVzOiB1bmtub3duKTogc3RyaW5nW10ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSkgcmV0dXJuIFtdO1xuICByZXR1cm4gWy4uLm5ldyBTZXQodmFsdWVzLm1hcCgodikgPT4gU3RyaW5nKHYpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pKV07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNldHRpbmdzKHJhdzogUGFydGlhbDxUYXNrQm9hcmRTZXR0aW5ncz4gfCBudWxsIHwgdW5kZWZpbmVkKTogVGFza0JvYXJkU2V0dGluZ3Mge1xuICBjb25zdCBkZWZhdWx0cyA9IGNsb25lRGVmYXVsdHMoKTtcbiAgY29uc3Qgc2V0dGluZ3MgPSByYXcgPz8ge307XG5cbiAgY29uc3QgcmF3UHJvcGVydGllcyA9IEFycmF5LmlzQXJyYXkoc2V0dGluZ3MucHJvcGVydGllcykgPyBzZXR0aW5ncy5wcm9wZXJ0aWVzIDogZGVmYXVsdHMucHJvcGVydGllcztcbiAgY29uc3QgcHJvcGVydGllcyA9IHJhd1Byb3BlcnRpZXNcbiAgICAubWFwKChwcm9wZXJ0eSwgaW5kZXgpID0+ICh7XG4gICAgICBpZDogU3RyaW5nKHByb3BlcnR5Py5pZCA/PyBgcHJvcGVydHktJHtpbmRleCArIDF9YCksXG4gICAgICBuYW1lOiBTdHJpbmcocHJvcGVydHk/Lm5hbWUgPz8gJycpLnRyaW0oKSB8fCBgXHU1QzVFXHU2MDI3ICR7aW5kZXggKyAxfWAsXG4gICAgICBjb2xvcjogU3RyaW5nKHByb3BlcnR5Py5jb2xvciA/PyAnIzY0NzQ4YicpLFxuICAgIH0pKVxuICAgIC5maWx0ZXIoKHByb3BlcnR5KSA9PiBwcm9wZXJ0eS5uYW1lKTtcblxuICByZXR1cm4ge1xuICAgIGNvbHVtbnM6IHNhZmVQb3NpdGl2ZUludChOdW1iZXIoc2V0dGluZ3MuY29sdW1ucyksIGRlZmF1bHRzLmNvbHVtbnMsIDEsIDgpLFxuICAgIHJvd3M6IHNhZmVQb3NpdGl2ZUludChOdW1iZXIoc2V0dGluZ3Mucm93cyksIGRlZmF1bHRzLnJvd3MsIDEsIDgpLFxuICAgIGNhcmRMb2dDb3VudDogc2FmZVBvc2l0aXZlSW50KE51bWJlcihzZXR0aW5ncy5jYXJkTG9nQ291bnQpLCBkZWZhdWx0cy5jYXJkTG9nQ291bnQsIDAsIDEwKSxcbiAgICBjYXJkR2FwOiBzYWZlUG9zaXRpdmVJbnQoTnVtYmVyKHNldHRpbmdzLmNhcmRHYXApLCBkZWZhdWx0cy5jYXJkR2FwLCA0LCAyNCksXG4gICAgYmFja2dyb3VuZE9wYWNpdHk6IHNhZmVQb3NpdGl2ZUludChOdW1iZXIoc2V0dGluZ3MuYmFja2dyb3VuZE9wYWNpdHkpLCBkZWZhdWx0cy5iYWNrZ3JvdW5kT3BhY2l0eSwgMCwgMTAwKSxcbiAgICBiYWNrZ3JvdW5kT3ZlcmxheTogc2FmZVBvc2l0aXZlSW50KE51bWJlcihzZXR0aW5ncy5iYWNrZ3JvdW5kT3ZlcmxheSksIGRlZmF1bHRzLmJhY2tncm91bmRPdmVybGF5LCAwLCA4NSksXG4gICAgYmFja2dyb3VuZEJsdXI6IHNhZmVQb3NpdGl2ZUludChOdW1iZXIoc2V0dGluZ3MuYmFja2dyb3VuZEJsdXIpLCBkZWZhdWx0cy5iYWNrZ3JvdW5kQmx1ciwgMCwgMTIpLFxuICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXMubGVuZ3RoID4gMCA/IHByb3BlcnRpZXMgOiBkZWZhdWx0cy5wcm9wZXJ0aWVzLFxuICAgIHRhZ3M6IHVuaXF1ZVN0cmluZ3Moc2V0dGluZ3MudGFncykubGVuZ3RoID4gMCA/IHVuaXF1ZVN0cmluZ3Moc2V0dGluZ3MudGFncykgOiBkZWZhdWx0cy50YWdzLFxuICAgIG1ldHJpY3M6IEFycmF5LmlzQXJyYXkoc2V0dGluZ3MubWV0cmljcylcbiAgICAgID8gc2V0dGluZ3MubWV0cmljc1xuICAgICAgICAgIC5tYXAoKG1ldHJpYywgaW5kZXgpID0+ICh7XG4gICAgICAgICAgICBpZDogU3RyaW5nKG1ldHJpYz8uaWQgPz8gYG1ldHJpYy0ke2luZGV4ICsgMX1gKSxcbiAgICAgICAgICAgIG5hbWU6IFN0cmluZyhtZXRyaWM/Lm5hbWUgPz8gJycpLnRyaW0oKSB8fCBgXHU2MzA3XHU2ODA3ICR7aW5kZXggKyAxfWAsXG4gICAgICAgICAgfSkpXG4gICAgICAgICAgLmZpbHRlcigobWV0cmljKSA9PiBtZXRyaWMubmFtZSlcbiAgICAgIDogZGVmYXVsdHMubWV0cmljcyxcbiAgICBzdGF0c0NvbHVtbnM6IHVuaXF1ZVN0cmluZ3Moc2V0dGluZ3Muc3RhdHNDb2x1bW5zKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRGVtb1Rhc2tzKHNldHRpbmdzOiBUYXNrQm9hcmRTZXR0aW5ncyk6IFRhc2tbXSB7XG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGNvbnN0IG1pbnV0ZXMgPSAobjogbnVtYmVyKSA9PiBub3cgLSBuICogNjBfMDAwO1xuICBjb25zdCBwcm9wZXJ0eUlkID0gKGlkOiBzdHJpbmcpID0+IHNldHRpbmdzLnByb3BlcnRpZXMuc29tZSgocCkgPT4gcC5pZCA9PT0gaWQpID8gaWQgOiBzZXR0aW5ncy5wcm9wZXJ0aWVzWzBdLmlkO1xuXG4gIGNvbnN0IGRlbW8gPSBbXG4gICAgWydcdTVCOENcdTYyMTAgU1FMIFx1NjU3MFx1NjM2RVx1NjNEMFx1NTNENicsICd3b3JrJywgWydcdTkxQ0RcdTg5ODEnXSwgJ1x1NUI4Q1x1NjIxMFx1NzUzM1x1OEJGN1x1MzAwMVx1NTQwOFx1NTQwQ1x1MzAwMVx1OEQzN1x1NkIzRVx1ODg2OFx1NTE3M1x1ODA1NFx1MzAwMiddLFxuICAgIFsnXHU1OTBEXHU0RTYwIFR5cGVTY3JpcHQnLCAnc3R1ZHknLCBbJ1x1OTU3Rlx1NjcxRiddLCAnXHU1OTBEXHU0RTYwIGludGVyZmFjZVx1MzAwMXR5cGUgXHU1NDhDXHU2Q0RCXHU1NzhCXHUzMDAyJ10sXG4gICAgWydcdTY1NzRcdTc0MDYgT2JzaWRpYW4gXHU2M0QyXHU0RUY2XHU5NzAwXHU2QzQyJywgJ3Byb2plY3QnLCBbJ1x1OTFDRFx1ODk4MSddLCAnXHU1QjhDXHU2MjEwIDNcdTAwRDczIFx1NTM2MVx1NzI0N1x1NUUwM1x1NUM0MFx1OEJCRVx1OEJBMVx1MzAwMiddLFxuICAgIFsnXHU4REQxXHU2QjY1IDMwIFx1NTIwNlx1OTQ5RicsICdwZXJzb25hbCcsIFsnXHU2NUU1XHU1RTM4J10sICdcdTRFQ0FcdTU5MjlcdTVCOENcdTYyMTAgNSBcdTUxNkNcdTkxQ0NcdTMwMDInXSxcbiAgICBbJ1x1OEJCRVx1OEJBMVx1NEVGQlx1NTJBMVx1NTM2MVx1NzI0NycsICdwcm9qZWN0JywgWydcdTk1N0ZcdTY3MUYnXSwgJ1x1NTg5RVx1NTJBMFx1NEVGQlx1NTJBMVx1N0M3Qlx1NTc4Qlx1OTg5Q1x1ODI3Mlx1MzAwMiddLFxuICAgIFsnXHU2NTc0XHU3NDA2XHU2NzJDXHU1NDY4XHU1REU1XHU0RjVDJywgJ3dvcmsnLCBbJ1x1NURFNVx1NEY1Q1x1NjVFNVx1NUUzOCddLCAnXHU2NTc0XHU3NDA2XHU2NzJDXHU1NDY4XHU5MUNEXHU3MEI5XHU0RThCXHU5ODc5XHUzMDAyJ10sXG4gICAgWydcdTk2MDVcdThCRkJcdTYyODBcdTY3MkZcdTY1ODdcdTY4NjMnLCAnc3R1ZHknLCBbJ1x1OTU3Rlx1NjcxRiddLCAnXHU5NjA1XHU4QkZCIE9ic2lkaWFuIEl0ZW1WaWV3IFx1NjU4N1x1Njg2M1x1MzAwMiddLFxuICAgIFsnXHU4RDJEXHU0RTcwXHU3NTFGXHU2RDNCXHU3NTI4XHU1NEMxJywgJ3BlcnNvbmFsJywgW10sICcnXSxcbiAgICBbJ1x1NTI2OVx1NEY1OVx1NEVGQlx1NTJBMVx1NzkzQVx1NEY4QiAxJywgJ290aGVyJywgWydcdTdEMjdcdTYwMjUnXSwgJyddLFxuICAgIFsnXHU1MjY5XHU0RjU5XHU0RUZCXHU1MkExXHU3OTNBXHU0RjhCIDInLCAnb3RoZXInLCBbXSwgJyddLFxuICBdO1xuXG4gIGNvbnN0IGJvYXJkQ2FwYWNpdHkgPSBNYXRoLm1heCgwLCBzZXR0aW5ncy5jb2x1bW5zICogc2V0dGluZ3Mucm93cyAtIDEpO1xuXG4gIHJldHVybiBkZW1vLm1hcCgoW3RpdGxlLCBvbGRQcm9wZXJ0eSwgdGFncywgbG9nXSwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBjcmVhdGVkQXQgPSBtaW51dGVzKDQ4MCAtIGluZGV4ICogMjApO1xuICAgIGNvbnN0IHVwZGF0ZWRBdCA9IG1pbnV0ZXMoMjAgKyBpbmRleCAqIDEwKTtcbiAgICBjb25zdCBtZXRyaWNzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgIHNldHRpbmdzLm1ldHJpY3MuZm9yRWFjaCgobWV0cmljLCBtZXRyaWNJbmRleCkgPT4ge1xuICAgICAgbWV0cmljc1ttZXRyaWMuaWRdID0gaW5kZXggPCAyICYmIG1ldHJpY0luZGV4ID09PSAwO1xuICAgIH0pO1xuXG4gICAgY29uc3QgbG9nczogVGFza0xvZ1tdID0gbG9nXG4gICAgICA/IFt7IGlkOiBjcmVhdGVJZCgnbG9nJyksIGNvbnRlbnQ6IGxvZyBhcyBzdHJpbmcsIGVkaXRlZEF0OiB1cGRhdGVkQXQgfV1cbiAgICAgIDogW107XG5cbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGNyZWF0ZUlkKCd0YXNrJyksXG4gICAgICB0aXRsZTogdGl0bGUgYXMgc3RyaW5nLFxuICAgICAgcHJvcGVydHlJZDogcHJvcGVydHlJZChvbGRQcm9wZXJ0eSBhcyBzdHJpbmcpLFxuICAgICAgdGFnczogdW5pcXVlU3RyaW5ncyh0YWdzKSxcbiAgICAgIG1ldHJpY3MsXG4gICAgICBsb2dzLFxuICAgICAgY3JlYXRlZEF0LFxuICAgICAgdXBkYXRlZEF0LFxuICAgICAgY29tcGxldGVkOiBmYWxzZSxcbiAgICAgIHZpc2libGVPbkJvYXJkOiBpbmRleCA8IGJvYXJkQ2FwYWNpdHksXG4gICAgfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFByb3BlcnR5KHNldHRpbmdzOiBUYXNrQm9hcmRTZXR0aW5ncywgcHJvcGVydHlJZDogc3RyaW5nKTogVGFza1Byb3BlcnR5RGVmIHtcbiAgcmV0dXJuIHNldHRpbmdzLnByb3BlcnRpZXMuZmluZCgocHJvcGVydHkpID0+IHByb3BlcnR5LmlkID09PSBwcm9wZXJ0eUlkKSA/PyBzZXR0aW5ncy5wcm9wZXJ0aWVzWzBdID8/IHtcbiAgICBpZDogJ290aGVyJyxcbiAgICBuYW1lOiAnXHU1MTc2XHU0RUQ2JyxcbiAgICBjb2xvcjogJyM2NDc0OGInLFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUYXNrQm9hcmRQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBkYXRhOiBTdG9yZWREYXRhID0ge1xuICAgIHRhc2tzOiBbXSxcbiAgICBzZXR0aW5nczogY2xvbmVEZWZhdWx0cygpLFxuICAgIG1lbW9Ub3BpY3M6IFtdLFxuICB9O1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRQbHVnaW5EYXRhKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhWSUVXX1RZUEVfVEFTS19CT0FSRCwgKGxlYWYpID0+IG5ldyBUYXNrQm9hcmRWaWV3KGxlYWYsIHRoaXMpKTtcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhWSUVXX1RZUEVfTUVNTywgKGxlYWYpID0+IG5ldyBNZW1vVmlldyhsZWFmLCB0aGlzKSk7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFX1NUQVRTLCAobGVhZikgPT4gbmV3IFN0YXRzVmlldyhsZWFmLCB0aGlzKSk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFRhc2tCb2FyZFNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbignbGF5b3V0LWRhc2hib2FyZCcsICdcdTYyNTNcdTVGMDBcdTRFRkJcdTUyQTFcdTc3MEJcdTY3N0YnLCAoKSA9PiB2b2lkIHRoaXMuYWN0aXZhdGVWaWV3KFZJRVdfVFlQRV9UQVNLX0JPQVJEKSk7XG4gICAgdGhpcy5hZGRSaWJib25JY29uKCdub3RlYm9vay1wZW4nLCAnXHU2MjUzXHU1RjAwXHU1OTA3XHU1RkQ4XHU1RjU1JywgKCkgPT4gdm9pZCB0aGlzLmFjdGl2YXRlVmlldyhWSUVXX1RZUEVfTUVNTykpO1xuICAgIHRoaXMuYWRkUmliYm9uSWNvbigndGFibGUtcHJvcGVydGllcycsICdcdTYyNTNcdTVGMDBcdTRFRkJcdTUyQTFcdTdFREZcdThCQTEnLCAoKSA9PiB2b2lkIHRoaXMuYWN0aXZhdGVWaWV3KFZJRVdfVFlQRV9TVEFUUykpO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiAnb3Blbi10YXNrLWJvYXJkJyxcbiAgICAgIG5hbWU6ICdcdTYyNTNcdTVGMDBcdTRFRkJcdTUyQTFcdTc3MEJcdTY3N0YnLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQgdGhpcy5hY3RpdmF0ZVZpZXcoVklFV19UWVBFX1RBU0tfQk9BUkQpLFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogJ29wZW4tbWVtbycsXG4gICAgICBuYW1lOiAnXHU2MjUzXHU1RjAwXHU1OTA3XHU1RkQ4XHU1RjU1JyxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHRoaXMuYWN0aXZhdGVWaWV3KFZJRVdfVFlQRV9NRU1PKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6ICdvcGVuLXN0YXRzJyxcbiAgICAgIG5hbWU6ICdcdTYyNTNcdTVGMDBcdTRFRkJcdTUyQTFcdTdFREZcdThCQTEnLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQgdGhpcy5hY3RpdmF0ZVZpZXcoVklFV19UWVBFX1NUQVRTKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6ICdjcmVhdGUtdGFzaycsXG4gICAgICBuYW1lOiAnXHU2NUIwXHU1RUZBXHU0RUZCXHU1MkExJyxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHRoaXMuY3JlYXRlQW5kT3BlblRhc2soKSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRQbHVnaW5EYXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJhdyA9IGF3YWl0IHRoaXMubG9hZERhdGEoKSBhcyBQYXJ0aWFsPFN0b3JlZERhdGE+IHwgbnVsbDtcbiAgICBjb25zdCBzZXR0aW5ncyA9IG5vcm1hbGl6ZVNldHRpbmdzKHJhdz8uc2V0dGluZ3MpO1xuICAgIGNvbnN0IHJhd1Rhc2tzID0gQXJyYXkuaXNBcnJheShyYXc/LnRhc2tzKSA/IHJhdy50YXNrcyA6IFtdO1xuICAgIGNvbnN0IGJvYXJkQ2FwYWNpdHkgPSBNYXRoLm1heCgwLCBzZXR0aW5ncy5jb2x1bW5zICogc2V0dGluZ3Mucm93cyAtIDEpO1xuXG4gICAgbGV0IHRhc2tzOiBUYXNrW107XG4gICAgaWYgKHJhd1Rhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGFza3MgPSBjcmVhdGVEZW1vVGFza3Moc2V0dGluZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YXNrcyA9IHJhd1Rhc2tzLm1hcCgocmF3VGFzazogYW55LCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBvbGRUeXBlID0gU3RyaW5nKHJhd1Rhc2sucHJvcGVydHlJZCA/PyByYXdUYXNrLnR5cGUgPz8gc2V0dGluZ3MucHJvcGVydGllc1swXT8uaWQgPz8gJ290aGVyJyk7XG4gICAgICAgIGNvbnN0IHByb3BlcnR5SWQgPSBzZXR0aW5ncy5wcm9wZXJ0aWVzLnNvbWUoKHApID0+IHAuaWQgPT09IG9sZFR5cGUpXG4gICAgICAgICAgPyBvbGRUeXBlXG4gICAgICAgICAgOiBzZXR0aW5ncy5wcm9wZXJ0aWVzWzBdPy5pZCA/PyAnb3RoZXInO1xuICAgICAgICBjb25zdCBtZXRyaWNzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgICAgICBjb25zdCBvbGRNZXRyaWNzID0gcmF3VGFzay5tZXRyaWNzICYmIHR5cGVvZiByYXdUYXNrLm1ldHJpY3MgPT09ICdvYmplY3QnID8gcmF3VGFzay5tZXRyaWNzIDoge307XG4gICAgICAgIHNldHRpbmdzLm1ldHJpY3MuZm9yRWFjaCgobWV0cmljKSA9PiB7XG4gICAgICAgICAgbWV0cmljc1ttZXRyaWMuaWRdID0gQm9vbGVhbihvbGRNZXRyaWNzW21ldHJpYy5pZF0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGlkOiBTdHJpbmcocmF3VGFzay5pZCA/PyBjcmVhdGVJZCgndGFzaycpKSxcbiAgICAgICAgICB0aXRsZTogU3RyaW5nKHJhd1Rhc2sudGl0bGUgPz8gJ1x1NjcyQVx1NTQ3RFx1NTQwRFx1NEVGQlx1NTJBMScpLFxuICAgICAgICAgIHByb3BlcnR5SWQsXG4gICAgICAgICAgdGFnczogdW5pcXVlU3RyaW5ncyhyYXdUYXNrLnRhZ3MpLFxuICAgICAgICAgIG1ldHJpY3MsXG4gICAgICAgICAgbG9nczogQXJyYXkuaXNBcnJheShyYXdUYXNrLmxvZ3MpXG4gICAgICAgICAgICA/IHJhd1Rhc2subG9ncy5tYXAoKGxvZzogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgIGlkOiBTdHJpbmcobG9nLmlkID8/IGNyZWF0ZUlkKCdsb2cnKSksXG4gICAgICAgICAgICAgICAgY29udGVudDogU3RyaW5nKGxvZy5jb250ZW50ID8/ICcnKSxcbiAgICAgICAgICAgICAgICBlZGl0ZWRBdDogTnVtYmVyKGxvZy5lZGl0ZWRBdCA/PyBEYXRlLm5vdygpKSxcbiAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICA6IFtdLFxuICAgICAgICAgIGNyZWF0ZWRBdDogTnVtYmVyKHJhd1Rhc2suY3JlYXRlZEF0ID8/IERhdGUubm93KCkpLFxuICAgICAgICAgIHVwZGF0ZWRBdDogTnVtYmVyKHJhd1Rhc2sudXBkYXRlZEF0ID8/IERhdGUubm93KCkpLFxuICAgICAgICAgIGNvbXBsZXRlZDogQm9vbGVhbihyYXdUYXNrLmNvbXBsZXRlZCksXG4gICAgICAgICAgdmlzaWJsZU9uQm9hcmQ6IHR5cGVvZiByYXdUYXNrLnZpc2libGVPbkJvYXJkID09PSAnYm9vbGVhbidcbiAgICAgICAgICAgID8gcmF3VGFzay52aXNpYmxlT25Cb2FyZFxuICAgICAgICAgICAgOiBpbmRleCA8IGJvYXJkQ2FwYWNpdHksXG4gICAgICAgICAgYmFja2dyb3VuZEltYWdlUGF0aDogdHlwZW9mIHJhd1Rhc2suYmFja2dyb3VuZEltYWdlUGF0aCA9PT0gJ3N0cmluZycgJiYgcmF3VGFzay5iYWNrZ3JvdW5kSW1hZ2VQYXRoLnRyaW0oKVxuICAgICAgICAgICAgPyByYXdUYXNrLmJhY2tncm91bmRJbWFnZVBhdGhcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbWVtb1RvcGljcyA9IEFycmF5LmlzQXJyYXkocmF3Py5tZW1vVG9waWNzKVxuICAgICAgPyByYXcubWVtb1RvcGljcy5tYXAoKHRvcGljOiBhbnksIHRvcGljSW5kZXg6IG51bWJlcikgPT4gKHtcbiAgICAgICAgICBpZDogU3RyaW5nKHRvcGljLmlkID8/IGNyZWF0ZUlkKCd0b3BpYycpKSxcbiAgICAgICAgICBvcmRlcjogTnVtYmVyLmlzRmluaXRlKE51bWJlcih0b3BpYy5vcmRlcikpID8gTnVtYmVyKHRvcGljLm9yZGVyKSA6IHRvcGljSW5kZXgsXG4gICAgICAgICAgdGl0bGU6IFN0cmluZyh0b3BpYy50aXRsZSA/PyAnXHU2NzJBXHU1NDdEXHU1NDBEXHU0RTNCXHU5ODk4JyksXG4gICAgICAgICAgcGlubmVkOiBCb29sZWFuKHRvcGljLnBpbm5lZCksXG4gICAgICAgICAgY3JlYXRlZEF0OiBOdW1iZXIodG9waWMuY3JlYXRlZEF0ID8/IERhdGUubm93KCkpLFxuICAgICAgICAgIHVwZGF0ZWRBdDogTnVtYmVyKHRvcGljLnVwZGF0ZWRBdCA/PyBEYXRlLm5vdygpKSxcbiAgICAgICAgICBub3RlczogQXJyYXkuaXNBcnJheSh0b3BpYy5ub3RlcylcbiAgICAgICAgICAgID8gdG9waWMubm90ZXMubWFwKChub3RlOiBhbnksIG5vdGVJbmRleDogbnVtYmVyKSA9PiAoe1xuICAgICAgICAgICAgICAgIGlkOiBTdHJpbmcobm90ZS5pZCA/PyBjcmVhdGVJZCgnbm90ZScpKSxcbiAgICAgICAgICAgICAgICBvcmRlcjogTnVtYmVyLmlzRmluaXRlKE51bWJlcihub3RlLm9yZGVyKSkgPyBOdW1iZXIobm90ZS5vcmRlcikgOiBub3RlSW5kZXgsXG4gICAgICAgICAgICAgICAgY29udGVudDogU3RyaW5nKG5vdGUuY29udGVudCA/PyAnJyksXG4gICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBOdW1iZXIobm90ZS5jcmVhdGVkQXQgPz8gRGF0ZS5ub3coKSksXG4gICAgICAgICAgICAgICAgdXBkYXRlZEF0OiBOdW1iZXIobm90ZS51cGRhdGVkQXQgPz8gRGF0ZS5ub3coKSksXG4gICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIC5zb3J0KChhOiBNZW1vTm90ZSwgYjogTWVtb05vdGUpID0+IGEub3JkZXIgLSBiLm9yZGVyKVxuICAgICAgICAgICAgICAgIC5tYXAoKG5vdGU6IE1lbW9Ob3RlLCBpbmRleDogbnVtYmVyKSA9PiAoeyAuLi5ub3RlLCBvcmRlcjogaW5kZXggfSkpXG4gICAgICAgICAgICA6IFtdLFxuICAgICAgICB9KSlcbiAgICAgICAgLnNvcnQoKGE6IE1lbW9Ub3BpYywgYjogTWVtb1RvcGljKSA9PiBhLm9yZGVyIC0gYi5vcmRlcilcbiAgICAgICAgLm1hcCgodG9waWM6IE1lbW9Ub3BpYywgaW5kZXg6IG51bWJlcikgPT4gKHsgLi4udG9waWMsIG9yZGVyOiBpbmRleCB9KSlcbiAgICAgIDogW107XG5cbiAgICB0aGlzLmRhdGEgPSB7IHRhc2tzLCBzZXR0aW5ncywgbWVtb1RvcGljcyB9O1xuXG4gICAgY29uc3QgcmVxdWlyZWRTdGF0cyA9IFsnY29tcGxldGVkJywgJ2xvZ0NvdW50J107XG4gICAgZm9yIChjb25zdCBzdGF0IG9mIHJlcXVpcmVkU3RhdHMpIHtcbiAgICAgIGlmICghdGhpcy5kYXRhLnNldHRpbmdzLnN0YXRzQ29sdW1ucy5pbmNsdWRlcyhzdGF0KSkge1xuICAgICAgICB0aGlzLmRhdGEuc2V0dGluZ3Muc3RhdHNDb2x1bW5zLnB1c2goc3RhdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5zYXZlUGx1Z2luRGF0YSgpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVBsdWdpbkRhdGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLmRhdGEpO1xuICB9XG5cbiAgYXN5bmMgYWN0aXZhdGVWaWV3KHZpZXdUeXBlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUodmlld1R5cGUpWzBdO1xuICAgIGlmIChleGlzdGluZykge1xuICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYoZXhpc3RpbmcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZigndGFiJyk7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiB2aWV3VHlwZSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgZ2V0VGFzayh0YXNrSWQ6IHN0cmluZyk6IFRhc2sgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmRhdGEudGFza3MuZmluZCgodGFzaykgPT4gdGFzay5pZCA9PT0gdGFza0lkKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVRhc2sodGl0bGUgPSAnXHU2NUIwXHU0RUZCXHU1MkExJyk6IFByb21pc2U8VGFzaz4ge1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgbWV0cmljczogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7fTtcbiAgICB0aGlzLmRhdGEuc2V0dGluZ3MubWV0cmljcy5mb3JFYWNoKChtZXRyaWMpID0+IHsgbWV0cmljc1ttZXRyaWMuaWRdID0gZmFsc2U7IH0pO1xuXG4gICAgY29uc3QgdGFzazogVGFzayA9IHtcbiAgICAgIGlkOiBjcmVhdGVJZCgndGFzaycpLFxuICAgICAgdGl0bGUsXG4gICAgICBwcm9wZXJ0eUlkOiB0aGlzLmRhdGEuc2V0dGluZ3MucHJvcGVydGllc1swXT8uaWQgPz8gJ290aGVyJyxcbiAgICAgIHRhZ3M6IFtdLFxuICAgICAgbWV0cmljcyxcbiAgICAgIGxvZ3M6IFtdLFxuICAgICAgY3JlYXRlZEF0OiBub3csXG4gICAgICB1cGRhdGVkQXQ6IG5vdyxcbiAgICAgIGNvbXBsZXRlZDogZmFsc2UsXG4gICAgICB2aXNpYmxlT25Cb2FyZDogdHJ1ZSxcbiAgICAgIGJhY2tncm91bmRJbWFnZVBhdGg6IHVuZGVmaW5lZCxcbiAgICB9O1xuXG4gICAgdGhpcy5kYXRhLnRhc2tzLnVuc2hpZnQodGFzayk7XG4gICAgYXdhaXQgdGhpcy5zYXZlUGx1Z2luRGF0YSgpO1xuICAgIHRoaXMucmVmcmVzaFZpZXdzKCk7XG4gICAgcmV0dXJuIHRhc2s7XG4gIH1cblxuICBhc3luYyBjcmVhdGVBbmRPcGVuVGFzaygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0YXNrID0gYXdhaXQgdGhpcy5jcmVhdGVUYXNrKCk7XG4gICAgbmV3IFRhc2tNb2RhbCh0aGlzLmFwcCwgdGhpcywgdGFzay5pZCkub3BlbigpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlVGFzayh0YXNrSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhc2sgPSB0aGlzLmdldFRhc2sodGFza0lkKTtcbiAgICBpZiAodGFzaz8uYmFja2dyb3VuZEltYWdlUGF0aCkgYXdhaXQgdGhpcy5kZWxldGVCYWNrZ3JvdW5kRmlsZSh0YXNrLmJhY2tncm91bmRJbWFnZVBhdGgpO1xuICAgIHRoaXMuZGF0YS50YXNrcyA9IHRoaXMuZGF0YS50YXNrcy5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uaWQgIT09IHRhc2tJZCk7XG4gICAgYXdhaXQgdGhpcy5zYXZlUGx1Z2luRGF0YSgpO1xuICAgIHRoaXMucmVmcmVzaFZpZXdzKCk7XG4gICAgbmV3IE5vdGljZSgnXHU0RUZCXHU1MkExXHU1REYyXHU1MjIwXHU5NjY0Jyk7XG4gIH1cblxuICBhc3luYyBzYXZlVGFzayh0YXNrOiBUYXNrKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGFzay51cGRhdGVkQXQgPSBEYXRlLm5vdygpO1xuICAgIGF3YWl0IHRoaXMuc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICB0aGlzLnJlZnJlc2hWaWV3cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVWYXVsdEZvbGRlcihwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwYXJ0cyA9IG5vcm1hbGl6ZVBhdGgocGF0aCkuc3BsaXQoJy8nKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgbGV0IGN1cnJlbnQgPSAnJztcbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtwYXJ0fWAgOiBwYXJ0O1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudCkpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGN1cnJlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZGVsZXRlQmFja2dyb3VuZEZpbGUocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKHBhdGgpKTtcbiAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gSWdub3JlIGEgbWlzc2luZy91bmF2YWlsYWJsZSBiYWNrZ3JvdW5kIGZpbGUuXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgc2V0VGFza0JhY2tncm91bmQodGFza0lkOiBzdHJpbmcsIGZpbGU6IEZpbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0YXNrID0gdGhpcy5nZXRUYXNrKHRhc2tJZCk7XG4gICAgaWYgKCF0YXNrKSByZXR1cm47XG4gICAgaWYgKCFmaWxlLnR5cGUuc3RhcnRzV2l0aCgnaW1hZ2UvJykpIHtcbiAgICAgIG5ldyBOb3RpY2UoJ1x1OEJGN1x1OTAwOVx1NjJFOVx1NTZGRVx1NzI0N1x1NjU4N1x1NEVGNlx1MzAwMicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZmlsZS5zaXplID4gMTAgKiAxMDI0ICogMTAyNCkge1xuICAgICAgbmV3IE5vdGljZSgnXHU1NkZFXHU3MjQ3XHU0RTBEXHU4MEZEXHU4RDg1XHU4RkM3IDEwIE1CXHUzMDAyXHU1RUZBXHU4QkFFXHU0RjdGXHU3NTI4XHU1MzhCXHU3RjI5XHU1NDBFXHU3Njg0IEpQRy9QTkdcdTMwMDInKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmb2xkZXIgPSAnVGFzayBCb2FyZC9CYWNrZ3JvdW5kcyc7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVWYXVsdEZvbGRlcihmb2xkZXIpO1xuICAgIGNvbnN0IGNsZWFuTmFtZSA9IGZpbGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS5fLV0rL2csICctJykucmVwbGFjZSgvLSsvZywgJy0nKS5zbGljZSgtODApIHx8ICdiYWNrZ3JvdW5kLWltYWdlJztcbiAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChgJHtmb2xkZXJ9LyR7dGFzay5pZH0tJHtEYXRlLm5vdygpfS0ke2NsZWFuTmFtZX1gKTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVCaW5hcnkocGF0aCwgYXdhaXQgZmlsZS5hcnJheUJ1ZmZlcigpKTtcblxuICAgIGNvbnN0IG9sZFBhdGggPSB0YXNrLmJhY2tncm91bmRJbWFnZVBhdGg7XG4gICAgdGFzay5iYWNrZ3JvdW5kSW1hZ2VQYXRoID0gcGF0aDtcbiAgICBhd2FpdCB0aGlzLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgaWYgKG9sZFBhdGggJiYgb2xkUGF0aCAhPT0gcGF0aCkgYXdhaXQgdGhpcy5kZWxldGVCYWNrZ3JvdW5kRmlsZShvbGRQYXRoKTtcbiAgICB0aGlzLnJlZnJlc2hWaWV3cygpO1xuICB9XG5cbiAgYXN5bmMgY2xlYXJUYXNrQmFja2dyb3VuZCh0YXNrSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhc2sgPSB0aGlzLmdldFRhc2sodGFza0lkKTtcbiAgICBpZiAoIXRhc2spIHJldHVybjtcbiAgICBjb25zdCBvbGRQYXRoID0gdGFzay5iYWNrZ3JvdW5kSW1hZ2VQYXRoO1xuICAgIHRhc2suYmFja2dyb3VuZEltYWdlUGF0aCA9IHVuZGVmaW5lZDtcbiAgICBhd2FpdCB0aGlzLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgaWYgKG9sZFBhdGgpIGF3YWl0IHRoaXMuZGVsZXRlQmFja2dyb3VuZEZpbGUob2xkUGF0aCk7XG4gICAgdGhpcy5yZWZyZXNoVmlld3MoKTtcbiAgfVxuXG4gIGdldFRhc2tCYWNrZ3JvdW5kVXJsKHRhc2s6IFRhc2spOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoIXRhc2suYmFja2dyb3VuZEltYWdlUGF0aCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKHRhc2suYmFja2dyb3VuZEltYWdlUGF0aCkpO1xuICAgIHJldHVybiBmaWxlIGluc3RhbmNlb2YgVEZpbGUgPyB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSkgOiBudWxsO1xuICB9XG5cbiAgYXN5bmMgcmVvcmRlclZpc2libGVUYXNrcyhkcmFnZ2VkSWQ6IHN0cmluZywgdGFyZ2V0SWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChkcmFnZ2VkSWQgPT09IHRhcmdldElkKSByZXR1cm47XG4gICAgY29uc3QgdmlzaWJsZUluZGV4ZXMgPSB0aGlzLmRhdGEudGFza3NcbiAgICAgIC5tYXAoKHRhc2ssIGluZGV4KSA9PiAoeyB0YXNrLCBpbmRleCB9KSlcbiAgICAgIC5maWx0ZXIoKHsgdGFzayB9KSA9PiB0YXNrLnZpc2libGVPbkJvYXJkKVxuICAgICAgLm1hcCgoeyBpbmRleCB9KSA9PiBpbmRleCk7XG4gICAgY29uc3QgZHJhZ2dlZEluZGV4SW5WaXNpYmxlID0gdmlzaWJsZUluZGV4ZXMuZmluZEluZGV4KChpbmRleCkgPT4gdGhpcy5kYXRhLnRhc2tzW2luZGV4XS5pZCA9PT0gZHJhZ2dlZElkKTtcbiAgICBjb25zdCB0YXJnZXRJbmRleEluVmlzaWJsZSA9IHZpc2libGVJbmRleGVzLmZpbmRJbmRleCgoaW5kZXgpID0+IHRoaXMuZGF0YS50YXNrc1tpbmRleF0uaWQgPT09IHRhcmdldElkKTtcbiAgICBpZiAoZHJhZ2dlZEluZGV4SW5WaXNpYmxlIDwgMCB8fCB0YXJnZXRJbmRleEluVmlzaWJsZSA8IDApIHJldHVybjtcblxuICAgIGNvbnN0IHZpc2libGVUYXNrcyA9IHZpc2libGVJbmRleGVzLm1hcCgoaW5kZXgpID0+IHRoaXMuZGF0YS50YXNrc1tpbmRleF0pO1xuICAgIGNvbnN0IFtkcmFnZ2VkXSA9IHZpc2libGVUYXNrcy5zcGxpY2UoZHJhZ2dlZEluZGV4SW5WaXNpYmxlLCAxKTtcbiAgICB2aXNpYmxlVGFza3Muc3BsaWNlKHRhcmdldEluZGV4SW5WaXNpYmxlLCAwLCBkcmFnZ2VkKTtcbiAgICB2aXNpYmxlSW5kZXhlcy5mb3JFYWNoKChpbmRleCwgcG9zaXRpb24pID0+IHtcbiAgICAgIHRoaXMuZGF0YS50YXNrc1tpbmRleF0gPSB2aXNpYmxlVGFza3NbcG9zaXRpb25dO1xuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMuc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICB0aGlzLnJlZnJlc2hWaWV3cygpO1xuICB9XG5cbiAgYXN5bmMgcmVvcmRlck1lbW9Ub3BpY3MoZHJhZ2dlZElkOiBzdHJpbmcsIHRhcmdldElkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoZHJhZ2dlZElkID09PSB0YXJnZXRJZCkgcmV0dXJuO1xuICAgIGNvbnN0IGRyYWdnZWQgPSB0aGlzLmRhdGEubWVtb1RvcGljcy5maW5kKCh0b3BpYykgPT4gdG9waWMuaWQgPT09IGRyYWdnZWRJZCk7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5kYXRhLm1lbW9Ub3BpY3MuZmluZCgodG9waWMpID0+IHRvcGljLmlkID09PSB0YXJnZXRJZCk7XG4gICAgaWYgKCFkcmFnZ2VkIHx8ICF0YXJnZXQgfHwgZHJhZ2dlZC5waW5uZWQgIT09IHRhcmdldC5waW5uZWQpIHJldHVybjtcblxuICAgIGNvbnN0IGdyb3VwID0gdGhpcy5kYXRhLm1lbW9Ub3BpY3NcbiAgICAgIC5maWx0ZXIoKHRvcGljKSA9PiB0b3BpYy5waW5uZWQgPT09IGRyYWdnZWQucGlubmVkKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGEub3JkZXIgLSBiLm9yZGVyKTtcbiAgICBjb25zdCBmcm9tID0gZ3JvdXAuZmluZEluZGV4KCh0b3BpYykgPT4gdG9waWMuaWQgPT09IGRyYWdnZWRJZCk7XG4gICAgY29uc3QgdG8gPSBncm91cC5maW5kSW5kZXgoKHRvcGljKSA9PiB0b3BpYy5pZCA9PT0gdGFyZ2V0SWQpO1xuICAgIGlmIChmcm9tIDwgMCB8fCB0byA8IDApIHJldHVybjtcblxuICAgIGNvbnN0IFtpdGVtXSA9IGdyb3VwLnNwbGljZShmcm9tLCAxKTtcbiAgICBncm91cC5zcGxpY2UodG8sIDAsIGl0ZW0pO1xuICAgIGdyb3VwLmZvckVhY2goKHRvcGljLCBpbmRleCkgPT4geyB0b3BpYy5vcmRlciA9IGluZGV4OyB9KTtcblxuICAgIGNvbnN0IHBpbm5lZEdyb3VwID0gdGhpcy5kYXRhLm1lbW9Ub3BpY3MuZmlsdGVyKCh0b3BpYykgPT4gdG9waWMucGlubmVkKS5zb3J0KChhLCBiKSA9PiBhLm9yZGVyIC0gYi5vcmRlcik7XG4gICAgY29uc3QgdW5waW5uZWRHcm91cCA9IHRoaXMuZGF0YS5tZW1vVG9waWNzLmZpbHRlcigodG9waWMpID0+ICF0b3BpYy5waW5uZWQpLnNvcnQoKGEsIGIpID0+IGEub3JkZXIgLSBiLm9yZGVyKTtcbiAgICBsZXQgb3JkZXIgPSAwO1xuICAgIFsuLi5waW5uZWRHcm91cCwgLi4udW5waW5uZWRHcm91cF0uZm9yRWFjaCgodG9waWMpID0+IHsgdG9waWMub3JkZXIgPSBvcmRlcisrOyB9KTtcbiAgICB0aGlzLmRhdGEubWVtb1RvcGljcyA9IFsuLi5waW5uZWRHcm91cCwgLi4udW5waW5uZWRHcm91cF07XG5cbiAgICBhd2FpdCB0aGlzLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgdGhpcy5yZWZyZXNoVmlld3MoKTtcbiAgfVxuXG4gIGFzeW5jIHJlb3JkZXJNZW1vTm90ZXModG9waWNJZDogc3RyaW5nLCBkcmFnZ2VkSWQ6IHN0cmluZywgdGFyZ2V0SWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChkcmFnZ2VkSWQgPT09IHRhcmdldElkKSByZXR1cm47XG4gICAgY29uc3QgdG9waWMgPSB0aGlzLmRhdGEubWVtb1RvcGljcy5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSB0b3BpY0lkKTtcbiAgICBpZiAoIXRvcGljKSByZXR1cm47XG4gICAgY29uc3QgZnJvbSA9IHRvcGljLm5vdGVzLmZpbmRJbmRleCgobm90ZSkgPT4gbm90ZS5pZCA9PT0gZHJhZ2dlZElkKTtcbiAgICBjb25zdCB0byA9IHRvcGljLm5vdGVzLmZpbmRJbmRleCgobm90ZSkgPT4gbm90ZS5pZCA9PT0gdGFyZ2V0SWQpO1xuICAgIGlmIChmcm9tIDwgMCB8fCB0byA8IDApIHJldHVybjtcbiAgICBjb25zdCBbaXRlbV0gPSB0b3BpYy5ub3Rlcy5zcGxpY2UoZnJvbSwgMSk7XG4gICAgdG9waWMubm90ZXMuc3BsaWNlKHRvLCAwLCBpdGVtKTtcbiAgICB0b3BpYy5ub3Rlcy5mb3JFYWNoKChub3RlLCBpbmRleCkgPT4geyBub3RlLm9yZGVyID0gaW5kZXg7IH0pO1xuICAgIHRvcGljLnVwZGF0ZWRBdCA9IERhdGUubm93KCk7XG4gICAgYXdhaXQgdGhpcy5zYXZlUGx1Z2luRGF0YSgpO1xuICAgIHRoaXMucmVmcmVzaFZpZXdzKCk7XG4gIH1cblxuICByZWZyZXNoVmlld3MoKTogdm9pZCB7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IHZpZXdUeXBlIG9mIFtWSUVXX1RZUEVfVEFTS19CT0FSRCwgVklFV19UWVBFX01FTU8sIFZJRVdfVFlQRV9TVEFUU10pIHtcbiAgICAgICAgZm9yIChjb25zdCBsZWFmIG9mIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUodmlld1R5cGUpKSB7XG4gICAgICAgICAgY29uc3QgdmlldyA9IGxlYWYudmlldyBhcyB1bmtub3duIGFzIHsgZ2V0Vmlld1R5cGU/OiAoKSA9PiBzdHJpbmc7IHJlbmRlcj86ICgpID0+IHZvaWQgfSB8IG51bGw7XG4gICAgICAgICAgaWYgKHZpZXc/LmdldFZpZXdUeXBlPy4oKSA9PT0gdmlld1R5cGUgJiYgdHlwZW9mIHZpZXcucmVuZGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2aWV3LnJlbmRlcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmNsYXNzIFRhc2tCb2FyZFNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcHJpdmF0ZSByZWFkb25seSB0YXNrQm9hcmRQbHVnaW46IFRhc2tCb2FyZFBsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBUYXNrQm9hcmRQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy50YXNrQm9hcmRQbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWw7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiAnVGFzayBCb2FyZCBcdThCQkVcdTdGNkUnIH0pO1xuXG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogJ1x1NEVGQlx1NTJBMVx1NzU0Q1x1OTc2MicgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXIpXG4gICAgICAuc2V0TmFtZSgnXHU2QTJBXHU1NDExXHU1MzYxXHU3MjQ3XHU2NTcwXHU5MUNGJylcbiAgICAgIC5zZXREZXNjKCdcdTRGOEJcdTU5ODIgMyBcdTg4NjhcdTc5M0FcdTZCQ0ZcdTg4NEMgMyBcdTVGMjBcdTUzNjFcdTcyNDdcdTMwMDInKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFZhbHVlKFN0cmluZyh0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLmNvbHVtbnMpKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5jb2x1bW5zID0gc2FmZVBvc2l0aXZlSW50KE51bWJlcih2YWx1ZSksIDMsIDEsIDgpO1xuICAgICAgICAgIGF3YWl0IHRoaXMudGFza0JvYXJkUGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4ucmVmcmVzaFZpZXdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lcilcbiAgICAgIC5zZXROYW1lKCdcdTdFQjVcdTU0MTFcdTUzNjFcdTcyNDdcdTY1NzBcdTkxQ0YnKVxuICAgICAgLnNldERlc2MoJ1x1NEY4Qlx1NTk4MiAzIFx1ODg2OFx1NzkzQVx1NjAzQlx1NTE3MSAzIFx1ODg0Q1x1MzAwMlx1NjcwMFx1NTQwRVx1NEUwMFx1NjgzQ1x1NTZGQVx1NUI5QVx1NEUzQVx1MjAxQ1x1NjYzRVx1NzkzQVx1NjI0MFx1NjcwOVx1NEVGQlx1NTJBMVx1MjAxRFx1MzAwMicpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEuc2V0dGluZ3Mucm93cykpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLnJvd3MgPSBzYWZlUG9zaXRpdmVJbnQoTnVtYmVyKHZhbHVlKSwgMywgMSwgOCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy50YXNrQm9hcmRQbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5yZWZyZXNoVmlld3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyKVxuICAgICAgLnNldE5hbWUoJ1x1NTM2MVx1NzI0N1x1NjVFNVx1NUZEN1x1Njc2MVx1NjU3MCcpXG4gICAgICAuc2V0RGVzYygnXHU1MzYxXHU3MjQ3XHU0RTBBXHU2NzAwXHU1OTFBXHU2NjNFXHU3OTNBXHU2NzAwXHU4RkQxXHU1MUUwXHU2NzYxXHU2NUU1XHU1RkQ3XHUzMDAyJylcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XG4gICAgICAgIC5zZXRWYWx1ZShTdHJpbmcodGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5jYXJkTG9nQ291bnQpKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5jYXJkTG9nQ291bnQgPSBzYWZlUG9zaXRpdmVJbnQoTnVtYmVyKHZhbHVlKSwgMywgMCwgMTApO1xuICAgICAgICAgIGF3YWl0IHRoaXMudGFza0JvYXJkUGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4ucmVmcmVzaFZpZXdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lcilcbiAgICAgIC5zZXROYW1lKCdcdTUzNjFcdTcyNDdcdTk1RjRcdThEREQnKVxuICAgICAgLnNldERlc2MoJ1x1NEVGQlx1NTJBMVx1NTM2MVx1NzI0N1x1NEU0Qlx1OTVGNFx1NzY4NFx1OTVGNFx1OERERFx1RkYwQ1x1NTM1NVx1NEY0RFx1NEUzQVx1NTBDRlx1N0QyMFx1MzAwMicpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEuc2V0dGluZ3MuY2FyZEdhcCkpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLmNhcmRHYXAgPSBzYWZlUG9zaXRpdmVJbnQoTnVtYmVyKHZhbHVlKSwgMTIsIDQsIDI0KTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnRhc2tCb2FyZFBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLnJlZnJlc2hWaWV3cygpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoJ2g0JywgeyB0ZXh0OiAnXHU0RUZCXHU1MkExXHU4MENDXHU2NjZGXHU1NkZFXHU3MjQ3JyB9KTtcbiAgICBjb250YWluZXIuY3JlYXRlRGl2KHtcbiAgICAgIHRleHQ6ICdcdTRFRkJcdTUyQTFcdTUzRUZcdTRFRTVcdTRGN0ZcdTc1MjhcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTRGNUNcdTRFM0FcdTUzNjFcdTcyNDdcdTgwQ0NcdTY2NkZcdTMwMDJcdTU2RkVcdTcyNDdcdTRGMUFcdTU5MERcdTUyMzZcdTUyMzBcdTVGNTNcdTUyNEQgVmF1bHQgXHU3Njg0IFx1MjAxQ1Rhc2sgQm9hcmQvQmFja2dyb3VuZHNcdTIwMUQgXHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU1NkUwXHU2QjY0XHU2MzYyXHU3NTM1XHU4MTExXHU1RTc2XHU1NDBDXHU2QjY1IFZhdWx0IFx1NTQwRVx1NEVDRFx1NzEzNlx1NTNFRlx1NEVFNVx1NEY3Rlx1NzUyOFx1MzAwMicsXG4gICAgICBjbHM6ICd0YXNrLWJvYXJkLXNldHRpbmctaGludCcsXG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXIpXG4gICAgICAuc2V0TmFtZSgnXHU4MENDXHU2NjZGXHU1NkZFXHU3MjQ3XHU5MDBGXHU2NjBFXHU1RUE2JylcbiAgICAgIC5zZXREZXNjKCdcdTY1NzBcdTUwM0NcdThEOEFcdTlBRDhcdUZGMENcdTgwQ0NcdTY2NkZcdTU2RkVcdTcyNDdcdThEOEFcdTY2MEVcdTY2M0VcdTMwMDIwIFx1ODg2OFx1NzkzQVx1NUI4Q1x1NTE2OFx1OTY5MFx1ODVDRlx1MzAwMicpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDAsIDEwMCwgMSlcbiAgICAgICAgLnNldFZhbHVlKHRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEuc2V0dGluZ3MuYmFja2dyb3VuZE9wYWNpdHkpXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLmJhY2tncm91bmRPcGFjaXR5ID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy50YXNrQm9hcmRQbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5yZWZyZXNoVmlld3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyKVxuICAgICAgLnNldE5hbWUoJ1x1ODBDQ1x1NjY2Rlx1NTZGRVx1NzI0N1x1NkEyMVx1N0NDQScpXG4gICAgICAuc2V0RGVzYygnXHU3RUQ5XHU4MENDXHU2NjZGXHU1NkZFXHU3MjQ3XHU1ODlFXHU1MkEwXHU4RjdCXHU1RkFFXHU2QTIxXHU3Q0NBXHVGRjBDXHU4QkE5XHU0RUZCXHU1MkExXHU2NTg3XHU1QjU3XHU2NkY0XHU1QkI5XHU2NjEzXHU5NjA1XHU4QkZCXHUzMDAyJylcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMCwgMTIsIDEpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLmJhY2tncm91bmRCbHVyKVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5iYWNrZ3JvdW5kQmx1ciA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMudGFza0JvYXJkUGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4ucmVmcmVzaFZpZXdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lcilcbiAgICAgIC5zZXROYW1lKCdcdTgwQ0NcdTY2NkZcdTkwNkVcdTdGNjlcdTVGM0FcdTVFQTYnKVxuICAgICAgLnNldERlc2MoJ1x1NTcyOFx1ODBDQ1x1NjY2Rlx1NTZGRVx1NzI0N1x1NEUwQVx1NTNFMFx1NTJBMFx1NEUwMFx1NUM0Mlx1NTM0QVx1OTAwRlx1NjYwRVx1OTA2RVx1N0Y2OVx1RkYwQ1x1NjNEMFx1NTM0N1x1NTM2MVx1NzI0N1x1NjU4N1x1NUI1N1x1NzY4NFx1NTNFRlx1OEJGQlx1NjAyN1x1MzAwMicpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDAsIDg1LCAxKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5iYWNrZ3JvdW5kT3ZlcmxheSlcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEuc2V0dGluZ3MuYmFja2dyb3VuZE92ZXJsYXkgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnRhc2tCb2FyZFBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLnJlZnJlc2hWaWV3cygpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiAnXHU0RUZCXHU1MkExXHU1QzVFXHU2MDI3JyB9KTtcbiAgICBjb250YWluZXIuY3JlYXRlRGl2KHtcbiAgICAgIHRleHQ6ICdcdTVDNUVcdTYwMjdcdTVDMzFcdTY2MkZcdTRFRkJcdTUyQTFcdTc2ODRcdTRFM0JcdTUyMDZcdTdDN0JcdUZGMENcdTRGOEJcdTU5ODJcdTIwMUNcdTVERTVcdTRGNUNcdTMwMDFcdTVCNjZcdTRFNjBcdTMwMDFcdTk4NzlcdTc2RUVcdTIwMURcdTMwMDJcdTZCQ0ZcdTRFMkFcdTVDNUVcdTYwMjdcdTUzRUZcdTRFRTVcdThCQkVcdTdGNkVcdTgxRUFcdTVERjFcdTc2ODRcdTk4OUNcdTgyNzJcdTMwMDInLFxuICAgICAgY2xzOiAndGFzay1ib2FyZC1zZXR0aW5nLWhpbnQnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcHJvcGVydGllc0NvbnRhaW5lciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWJvYXJkLXNldHRpbmctbGlzdCcgfSk7XG4gICAgdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5wcm9wZXJ0aWVzLmZvckVhY2goKHByb3BlcnR5KSA9PiB7XG4gICAgICB0aGlzLnJlbmRlclByb3BlcnR5U2V0dGluZyhwcm9wZXJ0aWVzQ29udGFpbmVyLCBwcm9wZXJ0eSk7XG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXIpXG4gICAgICAuYWRkQnV0dG9uKChidXR0b24pID0+IGJ1dHRvblxuICAgICAgICAuc2V0QnV0dG9uVGV4dCgnXHVGRjBCIFx1NkRGQlx1NTJBMFx1NEVGQlx1NTJBMVx1NUM1RVx1NjAyNycpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLnByb3BlcnRpZXMucHVzaCh7XG4gICAgICAgICAgICBpZDogY3JlYXRlSWQoJ3Byb3BlcnR5JyksXG4gICAgICAgICAgICBuYW1lOiAnXHU2NUIwXHU1QzVFXHU2MDI3JyxcbiAgICAgICAgICAgIGNvbG9yOiAnIzY0NzQ4YicsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYXdhaXQgdGhpcy50YXNrQm9hcmRQbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5yZWZyZXNoVmlld3MoKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogJ1x1NEVGQlx1NTJBMVx1NjgwN1x1N0I3RScgfSk7XG4gICAgY29udGFpbmVyLmNyZWF0ZURpdih7XG4gICAgICB0ZXh0OiAnXHU2QkNGXHU4ODRDXHU4RjkzXHU1MTY1XHU0RTAwXHU0RTJBXHU2ODA3XHU3QjdFXHUzMDAyXHU0RUZCXHU1MkExXHU3RjE2XHU4RjkxXHU3QTk3XHU1M0UzXHU0RjFBXHU2M0QwXHU0RjlCXHU1MkZFXHU5MDA5XHU2ODQ2XHUzMDAyJyxcbiAgICAgIGNsczogJ3Rhc2stYm9hcmQtc2V0dGluZy1oaW50JyxcbiAgICB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXIpXG4gICAgICAuc2V0TmFtZSgnXHU1M0VGXHU3NTI4XHU2ODA3XHU3QjdFJylcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ1x1OTFDRFx1ODk4MVxcblx1N0QyN1x1NjAyNVxcblx1OTU3Rlx1NjcxRicpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLnRhZ3Muam9pbignXFxuJykpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLnRhZ3MgPSB1bmlxdWVTdHJpbmdzKHZhbHVlLnNwbGl0KC9bXFxuLFx1RkYwQ10vKSk7XG4gICAgICAgICAgYXdhaXQgdGhpcy50YXNrQm9hcmRQbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5yZWZyZXNoVmlld3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogJ1x1NEVGQlx1NTJBMVx1NjMwN1x1NjgwNyAvIFx1N0VERlx1OEJBMVx1N0VGNFx1NUVBNicgfSk7XG4gICAgY29udGFpbmVyLmNyZWF0ZURpdih7XG4gICAgICB0ZXh0OiAnXHU4RkQ5XHU0RTlCXHU2MzA3XHU2ODA3XHU0RjFBXHU1NDBDXHU2NUY2XHU1MUZBXHU3M0IwXHU1NzI4XHU0RUZCXHU1MkExXHU1MzYxXHU3MjQ3XHU1RTk1XHU5MEU4XHVGRjBDXHU1RTc2XHU1M0VGXHU0RUU1XHU0RjVDXHU0RTNBXHU3RURGXHU4QkExXHU4ODY4XHU0RTJEXHU3Njg0XHU1MjE3XHUzMDAyXHU0RjhCXHU1OTgyXHUyMDFDXHU1REYyXHU1QjhDXHU2MjEwXHU1MjFEXHU2QjY1XHU0RkVFXHU2NTM5XHUyMDFEXHUyMDFDXHU1REYyXHU3RUNGXHU2M0QwXHU0RUE0XHU0RkVFXHU2NTM5XHUyMDFEXHUzMDAyJyxcbiAgICAgIGNsczogJ3Rhc2stYm9hcmQtc2V0dGluZy1oaW50JyxcbiAgICB9KTtcblxuICAgIGNvbnN0IG1ldHJpY3NDb250YWluZXIgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1ib2FyZC1zZXR0aW5nLWxpc3QnIH0pO1xuICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEuc2V0dGluZ3MubWV0cmljcy5mb3JFYWNoKChtZXRyaWMpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyTWV0cmljU2V0dGluZyhtZXRyaWNzQ29udGFpbmVyLCBtZXRyaWMpO1xuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiBidXR0b25cbiAgICAgICAgLnNldEJ1dHRvblRleHQoJ1x1RkYwQiBcdTZERkJcdTUyQTBcdTRFRkJcdTUyQTFcdTYzMDdcdTY4MDcnKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgaWQgPSBjcmVhdGVJZCgnbWV0cmljJyk7XG4gICAgICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5tZXRyaWNzLnB1c2goeyBpZCwgbmFtZTogJ1x1NjVCMFx1NjMwN1x1NjgwNycgfSk7XG4gICAgICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5zdGF0c0NvbHVtbnMucHVzaChpZCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy50YXNrQm9hcmRQbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5yZWZyZXNoVmlld3MoKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogJ1x1N0VERlx1OEJBMVx1ODg2OFx1NTIxNycgfSk7XG4gICAgY29udGFpbmVyLmNyZWF0ZURpdih7XG4gICAgICB0ZXh0OiAnXHU5MDA5XHU2MkU5XHU1NEVBXHU0RTlCXHU3RUY0XHU1RUE2XHU1MUZBXHU3M0IwXHU1NzI4XHU3RURGXHU4QkExXHU4ODY4XHU0RTJEXHUzMDAyJyxcbiAgICAgIGNsczogJ3Rhc2stYm9hcmQtc2V0dGluZy1oaW50JyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXRDb2x1bW5zID0gW1xuICAgICAgeyBpZDogJ2NvbXBsZXRlZCcsIG5hbWU6ICdcdTVERjJcdTVCOENcdTYyMTAnIH0sXG4gICAgICB7IGlkOiAnbG9nQ291bnQnLCBuYW1lOiAnXHU2NUU1XHU1RkQ3XHU2NTcwXHU5MUNGJyB9LFxuICAgICAgeyBpZDogJ3RhZ0NvdW50JywgbmFtZTogJ1x1NjgwN1x1N0I3RVx1NjU3MFx1OTFDRicgfSxcbiAgICAgIC4uLnRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEuc2V0dGluZ3MubWV0cmljcy5tYXAoKG1ldHJpYykgPT4gKHsgaWQ6IG1ldHJpYy5pZCwgbmFtZTogbWV0cmljLm5hbWUgfSkpLFxuICAgIF07XG5cbiAgICBzdGF0Q29sdW1ucy5mb3JFYWNoKChkaW1lbnNpb24pID0+IHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lcilcbiAgICAgICAgLnNldE5hbWUoZGltZW5zaW9uLm5hbWUpXG4gICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEuc2V0dGluZ3Muc3RhdHNDb2x1bW5zLmluY2x1ZGVzKGRpbWVuc2lvbi5pZCkpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgIGlmICghdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5zdGF0c0NvbHVtbnMuaW5jbHVkZXMoZGltZW5zaW9uLmlkKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEuc2V0dGluZ3Muc3RhdHNDb2x1bW5zLnB1c2goZGltZW5zaW9uLmlkKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5zdGF0c0NvbHVtbnMgPSB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLnN0YXRzQ29sdW1ucy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gZGltZW5zaW9uLmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGFza0JvYXJkUGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5yZWZyZXNoVmlld3MoKTtcbiAgICAgICAgICB9KSk7XG4gICAgfSk7XG5cbiAgICBjb250YWluZXIuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiAnXHU1MTc2XHU0RUQ2JyB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXIpXG4gICAgICAuc2V0TmFtZSgnXHU0RUZCXHU1MkExXHU2MzkyXHU1RThGXHU4QkY0XHU2NjBFJylcbiAgICAgIC5zZXREZXNjKCdcdTRFRkJcdTUyQTFcdTUzNjFcdTcyNDdcdTYzMDlcdTIwMUNcdTY2M0VcdTc5M0FcdTU3MjhcdTc3MEJcdTY3N0ZcdTIwMURcdTkwMDlcdTYyRTlcdTdFRDNcdTY3OUNcdTYzOTJcdTUyMTdcdUZGMUJcdTUyNjlcdTRGNTlcdTRFRkJcdTUyQTFcdTdFREZcdTRFMDBcdTY1M0VcdTU3MjhcdTY3MDBcdTU0MEVcdTRFMDBcdTY4M0NcdTMwMDInKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUHJvcGVydHlTZXR0aW5nKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3BlcnR5OiBUYXNrUHJvcGVydHlEZWYpOiB2b2lkIHtcbiAgICBjb25zdCByb3cgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1ib2FyZC1zZXR0aW5nLWl0ZW0nIH0pO1xuXG4gICAgY29uc3QgbmFtZUlucHV0ID0gcm93LmNyZWF0ZUVsKCdpbnB1dCcsIHtcbiAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgIHZhbHVlOiBwcm9wZXJ0eS5uYW1lLFxuICAgICAgY2xzOiAndGFzay1ib2FyZC1zZXR0aW5nLWlubGluZS1pbnB1dCcsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjb2xvcklucHV0ID0gcm93LmNyZWF0ZUVsKCdpbnB1dCcsIHtcbiAgICAgIHR5cGU6ICdjb2xvcicsXG4gICAgICB2YWx1ZTogcHJvcGVydHkuY29sb3IsXG4gICAgICBjbHM6ICd0YXNrLWJvYXJkLXNldHRpbmctY29sb3InLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGVsZXRlQnV0dG9uID0gcm93LmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICdcdTUyMjBcdTk2NjQnIH0pO1xuXG4gICAgbmFtZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgIHByb3BlcnR5Lm5hbWUgPSBuYW1lSW5wdXQudmFsdWUudHJpbSgpIHx8ICdcdTY3MkFcdTU0N0RcdTU0MERcdTVDNUVcdTYwMjcnO1xuICAgICAgdm9pZCB0aGlzLnRhc2tCb2FyZFBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpLnRoZW4oKCkgPT4gdGhpcy50YXNrQm9hcmRQbHVnaW4ucmVmcmVzaFZpZXdzKCkpO1xuICAgIH0pO1xuICAgIGNvbG9ySW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgcHJvcGVydHkuY29sb3IgPSBjb2xvcklucHV0LnZhbHVlO1xuICAgICAgdm9pZCB0aGlzLnRhc2tCb2FyZFBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpLnRoZW4oKCkgPT4gdGhpcy50YXNrQm9hcmRQbHVnaW4ucmVmcmVzaFZpZXdzKCkpO1xuICAgIH0pO1xuICAgIGRlbGV0ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLnByb3BlcnRpZXMubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgbmV3IE5vdGljZSgnXHU4MUYzXHU1QzExXHU5NzAwXHU4OTgxXHU0RkREXHU3NTU5XHU0RTAwXHU0RTJBXHU0RUZCXHU1MkExXHU1QzVFXHU2MDI3Jyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZhbGxiYWNrSWQgPSB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLnByb3BlcnRpZXMuZmluZCgoaXRlbSkgPT4gaXRlbS5pZCAhPT0gcHJvcGVydHkuaWQpPy5pZDtcbiAgICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEudGFza3MuZm9yRWFjaCgodGFzaykgPT4ge1xuICAgICAgICBpZiAodGFzay5wcm9wZXJ0eUlkID09PSBwcm9wZXJ0eS5pZCAmJiBmYWxsYmFja0lkKSB0YXNrLnByb3BlcnR5SWQgPSBmYWxsYmFja0lkO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLnByb3BlcnRpZXMgPSB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnNldHRpbmdzLnByb3BlcnRpZXMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmlkICE9PSBwcm9wZXJ0eS5pZCk7XG4gICAgICB2b2lkIHRoaXMudGFza0JvYXJkUGx1Z2luLnNhdmVQbHVnaW5EYXRhKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLnJlZnJlc2hWaWV3cygpO1xuICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNZXRyaWNTZXR0aW5nKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG1ldHJpYzogVGFza01ldHJpY0RlZik6IHZvaWQge1xuICAgIGNvbnN0IHJvdyA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWJvYXJkLXNldHRpbmctaXRlbScgfSk7XG4gICAgY29uc3QgbmFtZUlucHV0ID0gcm93LmNyZWF0ZUVsKCdpbnB1dCcsIHtcbiAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgIHZhbHVlOiBtZXRyaWMubmFtZSxcbiAgICAgIGNsczogJ3Rhc2stYm9hcmQtc2V0dGluZy1pbmxpbmUtaW5wdXQnLFxuICAgIH0pO1xuICAgIGNvbnN0IGRlbGV0ZUJ1dHRvbiA9IHJvdy5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnXHU1MjIwXHU5NjY0JyB9KTtcblxuICAgIG5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICBtZXRyaWMubmFtZSA9IG5hbWVJbnB1dC52YWx1ZS50cmltKCkgfHwgJ1x1NjcyQVx1NTQ3RFx1NTQwRFx1NjMwN1x1NjgwNyc7XG4gICAgICB2b2lkIHRoaXMudGFza0JvYXJkUGx1Z2luLnNhdmVQbHVnaW5EYXRhKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLnJlZnJlc2hWaWV3cygpO1xuICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVsZXRlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5tZXRyaWNzID0gdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5tZXRyaWNzLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5pZCAhPT0gbWV0cmljLmlkKTtcbiAgICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLmRhdGEuc2V0dGluZ3Muc3RhdHNDb2x1bW5zID0gdGhpcy50YXNrQm9hcmRQbHVnaW4uZGF0YS5zZXR0aW5ncy5zdGF0c0NvbHVtbnMuZmlsdGVyKChpZCkgPT4gaWQgIT09IG1ldHJpYy5pZCk7XG4gICAgICB0aGlzLnRhc2tCb2FyZFBsdWdpbi5kYXRhLnRhc2tzLmZvckVhY2goKHRhc2spID0+IGRlbGV0ZSB0YXNrLm1ldHJpY3NbbWV0cmljLmlkXSk7XG4gICAgICB2b2lkIHRoaXMudGFza0JvYXJkUGx1Z2luLnNhdmVQbHVnaW5EYXRhKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMudGFza0JvYXJkUGx1Z2luLnJlZnJlc2hWaWV3cygpO1xuICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmNsYXNzIFRhc2tCb2FyZFZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBUYXNrQm9hcmRQbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBWSUVXX1RZUEVfVEFTS19CT0FSRDsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gJ1x1NEVGQlx1NTJBMVx1NzcwQlx1Njc3Ric7IH1cbiAgZ2V0SWNvbigpOiBzdHJpbmcgeyByZXR1cm4gJ2xheW91dC1kYXNoYm9hcmQnOyB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4geyB0aGlzLnJlbmRlcigpOyB9XG4gIGFzeW5jIG9uQ2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cblxuICByZW5kZXIoKTogdm9pZCB7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuY29udGVudEVsO1xuICAgIHJvb3QuZW1wdHkoKTtcbiAgICByb290LmFkZENsYXNzKCd0YXNrLWJvYXJkLXZpZXcnKTtcblxuICAgIGNvbnN0IHsgY29sdW1ucywgcm93cyB9ID0gdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncztcbiAgICBjb25zdCBzbG90Q291bnQgPSBNYXRoLm1heCgxLCBjb2x1bW5zICogcm93cyk7XG4gICAgY29uc3QgY2FyZENhcGFjaXR5ID0gTWF0aC5tYXgoMCwgc2xvdENvdW50IC0gMSk7XG5cbiAgICBjb25zdCBoZWFkZXIgPSByb290LmNyZWF0ZURpdih7IGNsczogJ3Rhc2stYm9hcmQtaGVhZGVyJyB9KTtcbiAgICBjb25zdCBoZWFkZXJUZXh0ID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stYm9hcmQtaGVhZGVyLXRleHQnIH0pO1xuICAgIGhlYWRlclRleHQuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiAnXHU0RUZCXHU1MkExXHU3NzBCXHU2NzdGJywgY2xzOiAndGFzay1ib2FyZC1oZWFkaW5nJyB9KTtcbiAgICBoZWFkZXJUZXh0LmNyZWF0ZURpdih7XG4gICAgICB0ZXh0OiBgJHt0aGlzLnBsdWdpbi5kYXRhLnRhc2tzLmxlbmd0aH0gXHU0RTJBXHU0RUZCXHU1MkExIFx1MDBCNyAke2NvbHVtbnN9IFx1MDBENyAke3Jvd3N9IFx1NzcwQlx1Njc3RmAsXG4gICAgICBjbHM6ICd0YXNrLWJvYXJkLXN1YnRpdGxlJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1ib2FyZC1oZWFkZXItYWN0aW9ucycgfSk7XG4gICAgY29uc3QgbWVtb0J1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJ1x1NTkwN1x1NUZEOFx1NUY1NScsIGNsczogJ3Rhc2stYm9hcmQtc2Vjb25kYXJ5LWJ1dHRvbicgfSk7XG4gICAgbWVtb0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHZvaWQgdGhpcy5wbHVnaW4uYWN0aXZhdGVWaWV3KFZJRVdfVFlQRV9NRU1PKSk7XG5cbiAgICBjb25zdCBzdGF0c0J1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJ1x1N0VERlx1OEJBMScsIGNsczogJ3Rhc2stYm9hcmQtc2Vjb25kYXJ5LWJ1dHRvbicgfSk7XG4gICAgc3RhdHNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB2b2lkIHRoaXMucGx1Z2luLmFjdGl2YXRlVmlldyhWSUVXX1RZUEVfU1RBVFMpKTtcblxuICAgIGNvbnN0IGFkZEJ1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJysgXHU2NUIwXHU1RUZBXHU0RUZCXHU1MkExJywgY2xzOiAndGFzay1ib2FyZC1hZGQtYnV0dG9uJyB9KTtcbiAgICBhZGRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB2b2lkIHRoaXMucGx1Z2luLmNyZWF0ZUFuZE9wZW5UYXNrKCkpO1xuXG4gICAgY29uc3QgZ3JpZCA9IHJvb3QuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1ib2FyZC1ncmlkJyB9KTtcbiAgICBncmlkLnN0eWxlLnNldFByb3BlcnR5KCctLXRhc2stY29sdW1ucycsIFN0cmluZyhjb2x1bW5zKSk7XG4gICAgZ3JpZC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10YXNrLXJvd3MnLCBTdHJpbmcocm93cykpO1xuICAgIGdyaWQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdGFzay1nYXAnLCBgJHt0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmNhcmRHYXB9cHhgKTtcblxuICAgIGNvbnN0IHZpc2libGVUYXNrcyA9IHRoaXMucGx1Z2luLmRhdGEudGFza3NcbiAgICAgIC5maWx0ZXIoKHRhc2spID0+IHRhc2sudmlzaWJsZU9uQm9hcmQpXG4gICAgICAuc2xpY2UoMCwgY2FyZENhcGFjaXR5KTtcblxuICAgIHZpc2libGVUYXNrcy5mb3JFYWNoKCh0YXNrKSA9PiB0aGlzLnJlbmRlclRhc2tDYXJkKGdyaWQsIHRhc2spKTtcblxuICAgIHdoaWxlIChncmlkLmNoaWxkcmVuLmxlbmd0aCA8IGNhcmRDYXBhY2l0eSkge1xuICAgICAgZ3JpZC5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWJvYXJkLWVtcHR5LWNlbGwnIH0pO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyQWxsVGFza3NDYXJkKGdyaWQsIHRoaXMucGx1Z2luLmRhdGEudGFza3MpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJUYXNrQ2FyZChjb250YWluZXI6IEhUTUxFbGVtZW50LCB0YXNrOiBUYXNrKTogdm9pZCB7XG4gICAgY29uc3QgcHJvcGVydHkgPSBnZXRQcm9wZXJ0eSh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLCB0YXNrLnByb3BlcnR5SWQpO1xuICAgIGNvbnN0IGNhcmQgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBgdGFzay1jYXJkJHt0YXNrLmNvbXBsZXRlZCA/ICcgaXMtY29tcGxldGVkJyA6ICcnfWAgfSk7XG4gICAgY2FyZC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10YXNrLWNvbG9yJywgcHJvcGVydHkuY29sb3IpO1xuICAgIGNhcmQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdGFzay1iZy1vcGFjaXR5JywgU3RyaW5nKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuYmFja2dyb3VuZE9wYWNpdHkgLyAxMDApKTtcbiAgICBjYXJkLnN0eWxlLnNldFByb3BlcnR5KCctLXRhc2stYmctb3ZlcmxheScsIFN0cmluZyh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmJhY2tncm91bmRPdmVybGF5IC8gMTAwKSk7XG4gICAgY2FyZC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10YXNrLWJnLWJsdXInLCBgJHt0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmJhY2tncm91bmRCbHVyfXB4YCk7XG5cbiAgICBjb25zdCBiYWNrZ3JvdW5kVXJsID0gdGhpcy5wbHVnaW4uZ2V0VGFza0JhY2tncm91bmRVcmwodGFzayk7XG4gICAgaWYgKGJhY2tncm91bmRVcmwpIHtcbiAgICAgIGNhcmQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdGFzay1iZy1pbWFnZScsIGB1cmwoXCIke2JhY2tncm91bmRVcmwucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpfVwiKWApO1xuICAgICAgY2FyZC5hZGRDbGFzcygnaGFzLWJhY2tncm91bmQtaW1hZ2UnKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZW50ID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWNhcmQtY29udGVudCcgfSk7XG4gICAgY29uc3QgdGl0bGVSb3cgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogJ3Rhc2stY2FyZC10aXRsZS1yb3cnIH0pO1xuICAgIHRpdGxlUm93LmNyZWF0ZURpdih7IGNsczogJ3Rhc2stY2FyZC10eXBlLWRvdCcgfSkuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gcHJvcGVydHkuY29sb3I7XG4gICAgdGl0bGVSb3cuY3JlYXRlRGl2KHsgdGV4dDogdGFzay50aXRsZSwgY2xzOiAndGFzay1jYXJkLXRpdGxlJyB9KTtcbiAgICB0aXRsZVJvdy5jcmVhdGVEaXYoeyB0ZXh0OiBwcm9wZXJ0eS5uYW1lLCBjbHM6ICd0YXNrLWNhcmQtdHlwZS1sYWJlbCcgfSk7XG5cbiAgICBpZiAodGFzay50YWdzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHRhZ3MgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogJ3Rhc2stY2FyZC10YWdzJyB9KTtcbiAgICAgIHRhc2sudGFncy5zbGljZSgwLCA0KS5mb3JFYWNoKCh0YWcpID0+IHRhZ3MuY3JlYXRlU3Bhbih7IHRleHQ6IGAjJHt0YWd9YCwgY2xzOiAndGFzay1ib2FyZC10YWcnIH0pKTtcbiAgICB9XG5cbiAgICBjb25zdCBsb2dzID0gWy4uLnRhc2subG9nc10uc29ydCgoYSwgYikgPT4gYi5lZGl0ZWRBdCAtIGEuZWRpdGVkQXQpO1xuICAgIGNvbnN0IHByZXZpZXdMb2dzID0gbG9ncy5zbGljZSgwLCB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmNhcmRMb2dDb3VudCk7XG5cbiAgICBjb25zdCBsb2dzQ29udGFpbmVyID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWNhcmQtbG9ncycgfSk7XG4gICAgaWYgKHByZXZpZXdMb2dzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbG9nc0NvbnRhaW5lci5jcmVhdGVEaXYoeyB0ZXh0OiAnXHU4RkQ4XHU2Q0ExXHU2NzA5XHU2NUU1XHU1RkQ3JywgY2xzOiAndGFzay1jYXJkLWVtcHR5LWxvZycgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZXZpZXdMb2dzLmZvckVhY2goKGxvZykgPT4ge1xuICAgICAgICBjb25zdCByb3cgPSBsb2dzQ29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stY2FyZC1sb2cnIH0pO1xuICAgICAgICByb3cuY3JlYXRlRGl2KHsgdGV4dDogc2hvcnREYXRlKGxvZy5lZGl0ZWRBdCksIGNsczogJ3Rhc2stY2FyZC1sb2ctdGltZScgfSk7XG4gICAgICAgIHJvdy5jcmVhdGVEaXYoeyB0ZXh0OiBsb2cuY29udGVudCwgY2xzOiAndGFzay1jYXJkLWxvZy1jb250ZW50JyB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IG1ldHJpY3MgPSB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1ldHJpY3M7XG4gICAgaWYgKG1ldHJpY3MubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbWV0cmljQm94ID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWNhcmQtbWV0cmljcycgfSk7XG4gICAgICBtZXRyaWNzLmZvckVhY2goKG1ldHJpYykgPT4ge1xuICAgICAgICBjb25zdCBsYWJlbCA9IG1ldHJpY0JveC5jcmVhdGVFbCgnbGFiZWwnLCB7IGNsczogJ3Rhc2stY2FyZC1tZXRyaWMnIH0pO1xuICAgICAgICBjb25zdCBjaGVja2JveCA9IGxhYmVsLmNyZWF0ZUVsKCdpbnB1dCcsIHsgdHlwZTogJ2NoZWNrYm94JyB9KTtcbiAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IEJvb2xlYW4odGFzay5tZXRyaWNzW21ldHJpYy5pZF0pO1xuICAgICAgICBsYWJlbC5jcmVhdGVTcGFuKHsgdGV4dDogbWV0cmljLm5hbWUgfSk7XG4gICAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKSk7XG4gICAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5wbHVnaW4uZ2V0VGFzayh0YXNrLmlkKTtcbiAgICAgICAgICBpZiAoIWN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgICBjdXJyZW50Lm1ldHJpY3NbbWV0cmljLmlkXSA9IGNoZWNrYm94LmNoZWNrZWQ7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlVGFzayhjdXJyZW50KS50aGVuKCgpID0+IG5ldyBOb3RpY2UoYFx1NjMwN1x1NjgwN1x1MjAxQyR7bWV0cmljLm5hbWV9XHUyMDFEXHU1REYyXHU2NkY0XHU2NUIwYCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0YXNrLmNvbXBsZXRlZCkge1xuICAgICAgY29uc3QgZm9vdGVyID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWNhcmQtZm9vdGVyIHRhc2stY2FyZC1mb290ZXItY29tcGFjdCcgfSk7XG4gICAgICBmb290ZXIuY3JlYXRlU3Bhbih7IHRleHQ6ICdcdTVERjJcdTVCOENcdTYyMTAnLCBjbHM6ICd0YXNrLWNhcmQtY29tcGxldGVkLWJhZGdlJyB9KTtcbiAgICB9XG5cbiAgICBsZXQgZGlkRHJhZyA9IGZhbHNlO1xuICAgIGNhcmQuZHJhZ2dhYmxlID0gdHJ1ZTtcbiAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIChldmVudCkgPT4ge1xuICAgICAgZGlkRHJhZyA9IHRydWU7XG4gICAgICBjYXJkLmFkZENsYXNzKCdpcy1kcmFnZ2luZycpO1xuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyPy5zZXREYXRhKCd0ZXh0L3Rhc2stYm9hcmQtdGFzay1pZCcsIHRhc2suaWQpO1xuICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2ZlcikgZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSAnbW92ZSc7XG4gICAgfSk7XG4gICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ21vdmUnO1xuICAgICAgaWYgKCFjYXJkLmNsYXNzTGlzdC5jb250YWlucygnaXMtZHJhZ2dpbmcnKSkgY2FyZC5hZGRDbGFzcygnaXMtZHJhZy1vdmVyJyk7XG4gICAgfSk7XG4gICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCAoKSA9PiBjYXJkLnJlbW92ZUNsYXNzKCdpcy1kcmFnLW92ZXInKSk7XG4gICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW5kJywgKCkgPT4ge1xuICAgICAgY2FyZC5yZW1vdmVDbGFzcygnaXMtZHJhZ2dpbmcnKTtcbiAgICAgIGNhcmQucmVtb3ZlQ2xhc3MoJ2lzLWRyYWctb3ZlcicpO1xuICAgIH0pO1xuICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNhcmQucmVtb3ZlQ2xhc3MoJ2lzLWRyYWctb3ZlcicpO1xuICAgICAgY29uc3QgZHJhZ2dlZElkID0gZXZlbnQuZGF0YVRyYW5zZmVyPy5nZXREYXRhKCd0ZXh0L3Rhc2stYm9hcmQtdGFzay1pZCcpO1xuICAgICAgaWYgKGRyYWdnZWRJZCkgdm9pZCB0aGlzLnBsdWdpbi5yZW9yZGVyVmlzaWJsZVRhc2tzKGRyYWdnZWRJZCwgdGFzay5pZCk7XG4gICAgfSk7XG4gICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW5kJywgKCkgPT4ge1xuICAgICAgY2FyZC5yZW1vdmVDbGFzcygnaXMtZHJhZ2dpbmcnKTtcbiAgICAgIGNhcmQucmVtb3ZlQ2xhc3MoJ2lzLWRyYWctb3ZlcicpO1xuICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4geyBkaWREcmFnID0gZmFsc2U7IH0sIDI1MCk7XG4gICAgfSk7XG4gICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIGlmIChkaWREcmFnKSByZXR1cm47XG4gICAgICBuZXcgVGFza01vZGFsKHRoaXMuYXBwLCB0aGlzLnBsdWdpbiwgdGFzay5pZCkub3BlbigpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJBbGxUYXNrc0NhcmQoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgdGFza3M6IFRhc2tbXSk6IHZvaWQge1xuICAgIGNvbnN0IGNlbGwgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1hbGwtdGFza3Mtc3RhY2stY2VsbCcgfSk7XG4gICAgY2VsbC5kcmFnZ2FibGUgPSBmYWxzZTtcblxuICAgIGNvbnN0IGJ1dHRvbiA9IGNlbGwuY3JlYXRlRWwoJ2J1dHRvbicsIHtcbiAgICAgIHRleHQ6ICdcdTYyNTNcdTVGMDBcdTYyNDBcdTY3MDlcdTRFRkJcdTUyQTEnLFxuICAgICAgY2xzOiAndGFzay1hbGwtdGFza3Mtc3RhY2stYnV0dG9uJyxcbiAgICB9KTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBuZXcgQWxsVGFza3NNb2RhbCh0aGlzLmFwcCwgdGhpcy5wbHVnaW4pLm9wZW4oKSk7XG5cbiAgICBjb25zdCBzdGFjayA9IGNlbGwuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1zdGFjay12aXN1YWwnIH0pO1xuICAgIGNvbnN0IHByZXZpZXdzID0gTWF0aC5tYXgoNSwgTWF0aC5taW4oNywgdGFza3MubGVuZ3RoIHx8IDUpKTtcbiAgICBjb25zdCBwb3NlcyA9IFtcbiAgICAgIFstOSwgNCwgLTddLFxuICAgICAgWzcsIDIsIDVdLFxuICAgICAgWy0zLCAtNiwgLTJdLFxuICAgICAgWzEwLCA4LCA4XSxcbiAgICAgIFstNywgMTAsIDNdLFxuICAgICAgWzIsIDE0LCAtNl0sXG4gICAgICBbMTMsIDE3LCAtM10sXG4gICAgXTtcblxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcmV2aWV3czsgaW5kZXggKz0gMSkge1xuICAgICAgY29uc3QgcHJldmlldyA9IHN0YWNrLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stc3RhY2stcHJldmlldycgfSk7XG4gICAgICBjb25zdCBbeCwgeSwgcm90YXRpb25dID0gcG9zZXNbaW5kZXggJSBwb3Nlcy5sZW5ndGhdO1xuICAgICAgcHJldmlldy5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1zdGFjay14JywgYCR7eH1weGApO1xuICAgICAgcHJldmlldy5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1zdGFjay15JywgYCR7eX1weGApO1xuICAgICAgcHJldmlldy5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1zdGFjay1yb3RhdGlvbicsIGAke3JvdGF0aW9ufWRlZ2ApO1xuICAgICAgcHJldmlldy5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1zdGFjay1pbmRleCcsIFN0cmluZyhpbmRleCkpO1xuICAgIH1cblxuICAgIGlmICh0YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHN0YWNrLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stc3RhY2stZW1wdHknIH0pO1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBUYXNrTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogVGFza0JvYXJkUGx1Z2luLCBwcml2YXRlIHJlYWRvbmx5IHRhc2tJZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLmFwcGx5QmFja2Ryb3BCbHVyKCk7XG4gICAgdGhpcy5tb2RhbEVsLmFkZENsYXNzKCd0YXNrLWJvYXJkLXRhc2stbW9kYWwnKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHsgdGhpcy5jb250ZW50RWwuZW1wdHkoKTsgfVxuXG4gIHByaXZhdGUgYXBwbHlCYWNrZHJvcEJsdXIoKTogdm9pZCB7XG4gICAgdGhpcy5tb2RhbEVsLnBhcmVudEVsZW1lbnQ/LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCcubW9kYWwtYmcnKT8uY2xhc3NMaXN0LmFkZCgndGFzay1ib2FyZC1tb2RhbC1iYWNrZHJvcCcpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKTogdm9pZCB7XG4gICAgY29uc3QgdGFzayA9IHRoaXMucGx1Z2luLmdldFRhc2sodGhpcy50YXNrSWQpO1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGVudEVsO1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuXG4gICAgaWYgKCF0YXNrKSB7XG4gICAgICBjb250YWluZXIuY3JlYXRlRGl2KHsgdGV4dDogJ1x1NEVGQlx1NTJBMVx1NEUwRFx1NUI1OFx1NTcyOFx1MzAwMicgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJvcGVydHkgPSBnZXRQcm9wZXJ0eSh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLCB0YXNrLnByb3BlcnR5SWQpO1xuICAgIHRoaXMuc2V0VGl0bGUoJ1x1N0YxNlx1OEY5MVx1NEVGQlx1NTJBMScpO1xuXG4gICAgY29uc3QgaGVhZGVyID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stbW9kYWwtaGVhZGVyJyB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRGl2KHsgdGV4dDogdGFzay50aXRsZSwgY2xzOiAndGFzay1tb2RhbC10aXRsZS1wcmV2aWV3JyB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRGl2KHsgdGV4dDogYCR7cHJvcGVydHkubmFtZX0gXHUwMEI3IFx1NTIxQlx1NUVGQVx1NEU4RSAke2Zvcm1hdERhdGUodGFzay5jcmVhdGVkQXQpfWAsIGNsczogJ3Rhc2stbW9kYWwtbWV0YScgfSk7XG5cbiAgICBjb25zdCBlZGl0b3IgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1tb2RhbC1lZGl0b3ItdjInIH0pO1xuICAgIGVkaXRvci5jcmVhdGVEaXYoeyB0ZXh0OiAnXHU0RUZCXHU1MkExXHU1NDBEXHU3OUYwJywgY2xzOiAndGFzay1tb2RhbC1zZWN0aW9uLWxhYmVsJyB9KTtcbiAgICBjb25zdCB0aXRsZUlucHV0ID0gZWRpdG9yLmNyZWF0ZUVsKCdpbnB1dCcsIHsgdHlwZTogJ3RleHQnLCB2YWx1ZTogdGFzay50aXRsZSwgY2xzOiAndGFzay1tb2RhbC10aXRsZS1pbnB1dCcgfSk7XG5cbiAgICBlZGl0b3IuY3JlYXRlRGl2KHsgdGV4dDogJ1x1NEVGQlx1NTJBMVx1NUM1RVx1NjAyNycsIGNsczogJ3Rhc2stbW9kYWwtc2VjdGlvbi1sYWJlbCcgfSk7XG4gICAgY29uc3QgcHJvcGVydHlTZWxlY3QgPSBlZGl0b3IuY3JlYXRlRWwoJ3NlbGVjdCcsIHsgY2xzOiAndGFzay1tb2RhbC10eXBlLXNlbGVjdCcgfSk7XG4gICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5wcm9wZXJ0aWVzLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGNvbnN0IG9wdGlvbiA9IHByb3BlcnR5U2VsZWN0LmNyZWF0ZUVsKCdvcHRpb24nLCB7IHZhbHVlOiBpdGVtLmlkLCB0ZXh0OiBpdGVtLm5hbWUgfSk7XG4gICAgICBvcHRpb24uc2VsZWN0ZWQgPSBpdGVtLmlkID09PSB0YXNrLnByb3BlcnR5SWQ7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0dXNSb3cgPSBlZGl0b3IuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1tb2RhbC1zdGF0dXMtcm93JyB9KTtcbiAgICB0aGlzLnJlbmRlclRvZ2dsZShzdGF0dXNSb3csICdcdTVERjJcdTVCOENcdTYyMTAnLCB0YXNrLmNvbXBsZXRlZCwgKHZhbHVlKSA9PiB7XG4gICAgICB0YXNrLmNvbXBsZXRlZCA9IHZhbHVlO1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlVGFzayh0YXNrKS50aGVuKCgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIH0pO1xuICAgIHRoaXMucmVuZGVyVG9nZ2xlKHN0YXR1c1JvdywgJ1x1NjYzRVx1NzkzQVx1NTcyOFx1NEVGQlx1NTJBMVx1NzU0Q1x1OTc2MicsIHRhc2sudmlzaWJsZU9uQm9hcmQsICh2YWx1ZSkgPT4ge1xuICAgICAgdGFzay52aXNpYmxlT25Cb2FyZCA9IHZhbHVlO1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlVGFzayh0YXNrKS50aGVuKCgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIH0pO1xuXG4gICAgZWRpdG9yLmNyZWF0ZURpdih7IHRleHQ6ICdcdTRFRkJcdTUyQTFcdTY4MDdcdTdCN0UnLCBjbHM6ICd0YXNrLW1vZGFsLXNlY3Rpb24tbGFiZWwnIH0pO1xuICAgIGNvbnN0IHRhZ3NCb3ggPSBlZGl0b3IuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1tb2RhbC10YWctb3B0aW9ucycgfSk7XG4gICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy50YWdzLmZvckVhY2goKHRhZykgPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSB0YWdzQm94LmNyZWF0ZUVsKCdsYWJlbCcsIHsgY2xzOiAndGFzay1tb2RhbC10YWctb3B0aW9uJyB9KTtcbiAgICAgIGNvbnN0IGNoZWNrYm94ID0gbGFiZWwuY3JlYXRlRWwoJ2lucHV0JywgeyB0eXBlOiAnY2hlY2tib3gnIH0pO1xuICAgICAgY2hlY2tib3guY2hlY2tlZCA9IHRhc2sudGFncy5pbmNsdWRlcyh0YWcpO1xuICAgICAgbGFiZWwuY3JlYXRlU3Bhbih7IHRleHQ6IHRhZyB9KTtcbiAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgaWYgKGNoZWNrYm94LmNoZWNrZWQpIHtcbiAgICAgICAgICBpZiAoIXRhc2sudGFncy5pbmNsdWRlcyh0YWcpKSB0YXNrLnRhZ3MucHVzaCh0YWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRhc2sudGFncyA9IHRhc2sudGFncy5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0gIT09IHRhZyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc2F2ZUJ1dHRvbiA9IGVkaXRvci5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnXHU0RkREXHU1QjU4XHU0RUZCXHU1MkExXHU0RkUxXHU2MDZGJywgY2xzOiAnbW9kLWN0YSB0YXNrLW1vZGFsLXNhdmUtYnV0dG9uJyB9KTtcbiAgICBzYXZlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk6IHZvaWQgPT4ge1xuICAgICAgdGFzay50aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpIHx8ICdcdTY3MkFcdTU0N0RcdTU0MERcdTRFRkJcdTUyQTEnO1xuICAgICAgdGFzay5wcm9wZXJ0eUlkID0gcHJvcGVydHlTZWxlY3QudmFsdWU7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVUYXNrKHRhc2spLnRoZW4oKCkgPT4ge1xuICAgICAgICBuZXcgTm90aWNlKCdcdTRFRkJcdTUyQTFcdTRGRTFcdTYwNkZcdTVERjJcdTRGRERcdTVCNTgnKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZWRpdG9yLmNyZWF0ZURpdih7IHRleHQ6ICdcdTUzNjFcdTcyNDdcdTgwQ0NcdTY2NkZcdTU2RkVcdTcyNDcnLCBjbHM6ICd0YXNrLW1vZGFsLXNlY3Rpb24tbGFiZWwnIH0pO1xuICAgIGVkaXRvci5jcmVhdGVEaXYoe1xuICAgICAgdGV4dDogJ1x1ODBDQ1x1NjY2Rlx1NTZGRVx1NzI0N1x1NEYxQVx1NEZERFx1NUI1OFx1NTIzMFx1NUY1M1x1NTI0RCBWYXVsdCBcdTc2ODQgVGFzayBCb2FyZC9CYWNrZ3JvdW5kcyBcdTY1ODdcdTRFRjZcdTU5MzlcdTMwMDJcdThCQkVcdTdGNkVcdTRFMkRcdTc2ODRcdTkwMEZcdTY2MEVcdTVFQTZcdTMwMDFcdTZBMjFcdTdDQ0FcdTU0OENcdTkwNkVcdTdGNjlcdTVGM0FcdTVFQTZcdTRGMUFcdTVFOTRcdTc1MjhcdTUyMzBcdTYyNDBcdTY3MDlcdTRFRkJcdTUyQTFcdTUzNjFcdTcyNDdcdTMwMDInLFxuICAgICAgY2xzOiAndGFzay1tb2RhbC1zZWN0aW9uLWhpbnQnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYmFja2dyb3VuZFJvdyA9IGVkaXRvci5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWJhY2tncm91bmQtcm93JyB9KTtcbiAgICBjb25zdCBiYWNrZ3JvdW5kSW5wdXQgPSBiYWNrZ3JvdW5kUm93LmNyZWF0ZUVsKCdpbnB1dCcsIHsgdHlwZTogJ2ZpbGUnLCBjbHM6ICd0YXNrLWJhY2tncm91bmQtZmlsZS1pbnB1dCcgfSk7XG4gICAgYmFja2dyb3VuZElucHV0LmFjY2VwdCA9ICdpbWFnZS8qJztcbiAgICBjb25zdCBjaG9vc2VJbWFnZUJ1dHRvbiA9IGJhY2tncm91bmRSb3cuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogdGFzay5iYWNrZ3JvdW5kSW1hZ2VQYXRoID8gJ1x1NjZGNFx1NjM2Mlx1ODBDQ1x1NjY2Rlx1NTZGRVx1NzI0NycgOiAnXHU5MDA5XHU2MkU5XHU2NzJDXHU1NzMwXHU1NkZFXHU3MjQ3JywgY2xzOiAndGFzay1tb2RhbC1zZWNvbmRhcnktYnV0dG9uJyB9KTtcbiAgICBjaG9vc2VJbWFnZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IGJhY2tncm91bmRJbnB1dC5jbGljaygpKTtcbiAgICBiYWNrZ3JvdW5kSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IGJhY2tncm91bmRJbnB1dC5maWxlcz8uWzBdO1xuICAgICAgaWYgKCFmaWxlKSByZXR1cm47XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnNldFRhc2tCYWNrZ3JvdW5kKHRoaXMudGFza0lkLCBmaWxlKS50aGVuKCgpID0+IHtcbiAgICAgICAgbmV3IE5vdGljZSgnXHU0RUZCXHU1MkExXHU4MENDXHU2NjZGXHU1NkZFXHU3MjQ3XHU1REYyXHU2NkY0XHU2NUIwJyk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGlmICh0YXNrLmJhY2tncm91bmRJbWFnZVBhdGgpIHtcbiAgICAgIGNvbnN0IHVybCA9IHRoaXMucGx1Z2luLmdldFRhc2tCYWNrZ3JvdW5kVXJsKHRhc2spO1xuICAgICAgaWYgKHVybCkge1xuICAgICAgICBjb25zdCBwcmV2aWV3ID0gZWRpdG9yLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stYmFja2dyb3VuZC1wcmV2aWV3JyB9KTtcbiAgICAgICAgcHJldmlldy5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSBgdXJsKFwiJHt1cmwucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpfVwiKWA7XG4gICAgICB9XG4gICAgICBjb25zdCBjbGVhckJhY2tncm91bmQgPSBiYWNrZ3JvdW5kUm93LmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICdcdTc5RkJcdTk2NjRcdTgwQ0NcdTY2NkYnLCBjbHM6ICd0YXNrLW1vZGFsLWRhbmdlci1saW5rJyB9KTtcbiAgICAgIGNsZWFyQmFja2dyb3VuZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5jbGVhclRhc2tCYWNrZ3JvdW5kKHRoaXMudGFza0lkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBuZXcgTm90aWNlKCdcdTgwQ0NcdTY2NkZcdTU2RkVcdTcyNDdcdTVERjJcdTc5RkJcdTk2NjQnKTtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1ldHJpY3MubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbWV0cmljc0hlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLW1vZGFsLWxvZ3MtaGVhZGVyJyB9KTtcbiAgICAgIG1ldHJpY3NIZWFkZXIuY3JlYXRlRGl2KHsgdGV4dDogJ1x1NEVGQlx1NTJBMVx1NjMwN1x1NjgwNycsIGNsczogJ3Rhc2stbW9kYWwtc2VjdGlvbi10aXRsZScgfSk7XG4gICAgICBtZXRyaWNzSGVhZGVyLmNyZWF0ZURpdih7IHRleHQ6ICdcdThGRDlcdTRFOUJcdTYzMDdcdTY4MDdcdTU0MENcdTY1RjZcdTUzQzJcdTRFMEVcdTdFREZcdThCQTFcdTg4NjhcdTMwMDInLCBjbHM6ICd0YXNrLW1vZGFsLXNlY3Rpb24taGludCcgfSk7XG5cbiAgICAgIGNvbnN0IG1ldHJpY3NCb3ggPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1tb2RhbC1tZXRyaWNzLWdyaWQnIH0pO1xuICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5tZXRyaWNzLmZvckVhY2goKG1ldHJpYykgPT4ge1xuICAgICAgICBjb25zdCBsYWJlbCA9IG1ldHJpY3NCb3guY3JlYXRlRWwoJ2xhYmVsJywgeyBjbHM6ICd0YXNrLW1vZGFsLW1ldHJpYy1yb3cnIH0pO1xuICAgICAgICBjb25zdCBjaGVja2JveCA9IGxhYmVsLmNyZWF0ZUVsKCdpbnB1dCcsIHsgdHlwZTogJ2NoZWNrYm94JyB9KTtcbiAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IEJvb2xlYW4odGFzay5tZXRyaWNzW21ldHJpYy5pZF0pO1xuICAgICAgICBsYWJlbC5jcmVhdGVTcGFuKHsgdGV4dDogbWV0cmljLm5hbWUgfSk7XG4gICAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICB0YXNrLm1ldHJpY3NbbWV0cmljLmlkXSA9IGNoZWNrYm94LmNoZWNrZWQ7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlVGFzayh0YXNrKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBsb2dzSGVhZGVyID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stbW9kYWwtbG9ncy1oZWFkZXInIH0pO1xuICAgIGxvZ3NIZWFkZXIuY3JlYXRlRGl2KHsgdGV4dDogJ1x1NEVGQlx1NTJBMVx1NjVFNVx1NUZENycsIGNsczogJ3Rhc2stbW9kYWwtc2VjdGlvbi10aXRsZScgfSk7XG4gICAgbG9nc0hlYWRlci5jcmVhdGVEaXYoeyB0ZXh0OiAnXHU2MzA5XHU2NzAwXHU4RkQxXHU3RjE2XHU4RjkxXHU2NUY2XHU5NUY0XHU1MDEyXHU1RThGXHU2MzkyXHU1MjE3JywgY2xzOiAndGFzay1tb2RhbC1zZWN0aW9uLWhpbnQnIH0pO1xuXG4gICAgY29uc3QgbG9ncyA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLW1vZGFsLWxvZ3MnIH0pO1xuICAgIGNvbnN0IHNvcnRlZExvZ3MgPSBbLi4udGFzay5sb2dzXS5zb3J0KChhLCBiKSA9PiBiLmVkaXRlZEF0IC0gYS5lZGl0ZWRBdCk7XG4gICAgaWYgKHNvcnRlZExvZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICBsb2dzLmNyZWF0ZURpdih7IHRleHQ6ICdcdTY2ODJcdTY1RTBcdTY1RTVcdTVGRDdcdTMwMDInLCBjbHM6ICd0YXNrLW1vZGFsLWVtcHR5LWxvZ3MnIH0pO1xuICAgIH1cbiAgICBzb3J0ZWRMb2dzLmZvckVhY2goKGxvZykgPT4gdGhpcy5yZW5kZXJMb2cobG9ncywgbG9nKSk7XG5cbiAgICBjb25zdCBhZGRMb2dCb3ggPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1tb2RhbC1hZGQtbG9nJyB9KTtcbiAgICBhZGRMb2dCb3guY3JlYXRlRGl2KHsgdGV4dDogJ1x1NjVCMFx1NTg5RVx1NjVFNVx1NUZENycsIGNsczogJ3Rhc2stbW9kYWwtc2VjdGlvbi1sYWJlbCcgfSk7XG4gICAgY29uc3QgbmV3TG9nVGV4dGFyZWEgPSBhZGRMb2dCb3guY3JlYXRlRWwoJ3RleHRhcmVhJywge1xuICAgICAgY2xzOiAndGFzay1tb2RhbC1sb2ctaW5wdXQnLFxuICAgICAgcGxhY2Vob2xkZXI6ICdcdThCQjBcdTVGNTVcdThGRDlcdTZCMjFcdThGREJcdTVDNTVcdTIwMjZcdTIwMjYnLFxuICAgIH0pO1xuICAgIGNvbnN0IGFkZExvZ0J1dHRvbiA9IGFkZExvZ0JveC5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnXHU2REZCXHU1MkEwXHU2NUU1XHU1RkQ3JywgY2xzOiAndGFzay1tb2RhbC1zZWNvbmRhcnktYnV0dG9uJyB9KTtcbiAgICBhZGRMb2dCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gbmV3TG9nVGV4dGFyZWEudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCFjb250ZW50KSByZXR1cm4gbmV3IE5vdGljZSgnXHU4QkY3XHU1MTQ4XHU4RjkzXHU1MTY1XHU2NUU1XHU1RkQ3XHU1MTg1XHU1QkI5Jyk7XG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgY3VycmVudFRhc2sgPSB0aGlzLnBsdWdpbi5nZXRUYXNrKHRoaXMudGFza0lkKTtcbiAgICAgIGlmICghY3VycmVudFRhc2spIHJldHVybjtcbiAgICAgIGN1cnJlbnRUYXNrLmxvZ3MucHVzaCh7IGlkOiBjcmVhdGVJZCgnbG9nJyksIGNvbnRlbnQsIGVkaXRlZEF0OiBub3cgfSk7XG4gICAgICBjdXJyZW50VGFzay51cGRhdGVkQXQgPSBub3c7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVUYXNrKGN1cnJlbnRUYXNrKS50aGVuKCgpID0+IHtcbiAgICAgICAgbmV3IE5vdGljZSgnXHU2NUU1XHU1RkQ3XHU1REYyXHU2REZCXHU1MkEwJyk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGJvdHRvbSA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLW1vZGFsLWJvdHRvbS1hY3Rpb25zJyB9KTtcbiAgICBjb25zdCBkZWxldGVCdXR0b24gPSBib3R0b20uY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJ1x1NTIyMFx1OTY2NFx1NEVGQlx1NTJBMScsIGNsczogJ3Rhc2stbW9kYWwtZGFuZ2VyLWJ1dHRvbicgfSk7XG4gICAgZGVsZXRlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgaWYgKCF3aW5kb3cuY29uZmlybShgXHU3ODZFXHU1QjlBXHU1MjIwXHU5NjY0XHUyMDFDJHt0YXNrLnRpdGxlfVx1MjAxRFx1NTQxN1x1RkYxRmApKSByZXR1cm47XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmRlbGV0ZVRhc2sodGhpcy50YXNrSWQpLnRoZW4oKCkgPT4gdGhpcy5jbG9zZSgpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVG9nZ2xlKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHRleHQ6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4sIG9uQ2hhbmdlOiAodmFsdWU6IGJvb2xlYW4pID0+IHZvaWQpOiB2b2lkIHtcbiAgICBjb25zdCBsYWJlbCA9IGNvbnRhaW5lci5jcmVhdGVFbCgnbGFiZWwnLCB7IGNsczogJ3Rhc2stbW9kYWwtc3RhdHVzLXRvZ2dsZScgfSk7XG4gICAgY29uc3QgY2hlY2tib3ggPSBsYWJlbC5jcmVhdGVFbCgnaW5wdXQnLCB7IHR5cGU6ICdjaGVja2JveCcgfSk7XG4gICAgY2hlY2tib3guY2hlY2tlZCA9IHZhbHVlO1xuICAgIGxhYmVsLmNyZWF0ZVNwYW4oeyB0ZXh0IH0pO1xuICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IG9uQ2hhbmdlKGNoZWNrYm94LmNoZWNrZWQpKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTG9nKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGxvZzogVGFza0xvZyk6IHZvaWQge1xuICAgIGNvbnN0IHJvdyA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLW1vZGFsLWxvZy1yb3cnIH0pO1xuICAgIGNvbnN0IG1ldGEgPSByb3cuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1tb2RhbC1sb2ctbWV0YScgfSk7XG4gICAgbWV0YS5jcmVhdGVEaXYoeyB0ZXh0OiBmb3JtYXREYXRlKGxvZy5lZGl0ZWRBdCksIGNsczogJ3Rhc2stbW9kYWwtbG9nLXRpbWUnIH0pO1xuICAgIGNvbnN0IHRleHRhcmVhID0gcm93LmNyZWF0ZUVsKCd0ZXh0YXJlYScsIHsgY2xzOiAndGFzay1tb2RhbC1sb2ctdGV4dGFyZWEnIH0pO1xuICAgIHRleHRhcmVhLnZhbHVlID0gbG9nLmNvbnRlbnQ7XG5cbiAgICBjb25zdCBhY3Rpb25zID0gcm93LmNyZWF0ZURpdih7IGNsczogJ3Rhc2stbW9kYWwtbG9nLWFjdGlvbnMnIH0pO1xuICAgIGNvbnN0IHNhdmVCdXR0b24gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICdcdTRGRERcdTVCNThcdTRGRUVcdTY1MzknLCBjbHM6ICd0YXNrLW1vZGFsLXNlY29uZGFyeS1idXR0b24nIH0pO1xuICAgIGNvbnN0IGRlbGV0ZUJ1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJ1x1NTIyMFx1OTY2NFx1NjVFNVx1NUZENycsIGNsczogJ3Rhc2stbW9kYWwtZGFuZ2VyLWxpbmsnIH0pO1xuXG4gICAgc2F2ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2sgPSB0aGlzLnBsdWdpbi5nZXRUYXNrKHRoaXMudGFza0lkKTtcbiAgICAgIGlmICghdGFzaykgcmV0dXJuO1xuICAgICAgY29uc3QgY3VycmVudExvZyA9IHRhc2subG9ncy5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSBsb2cuaWQpO1xuICAgICAgaWYgKCFjdXJyZW50TG9nKSByZXR1cm47XG4gICAgICBjb25zdCBjb250ZW50ID0gdGV4dGFyZWEudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCFjb250ZW50KSByZXR1cm4gbmV3IE5vdGljZSgnXHU2NUU1XHU1RkQ3XHU0RTBEXHU4MEZEXHU0RTNBXHU3QTdBJyk7XG4gICAgICBjdXJyZW50TG9nLmNvbnRlbnQgPSBjb250ZW50O1xuICAgICAgY3VycmVudExvZy5lZGl0ZWRBdCA9IERhdGUubm93KCk7XG4gICAgICB0YXNrLnVwZGF0ZWRBdCA9IERhdGUubm93KCk7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVUYXNrKHRhc2spLnRoZW4oKCkgPT4ge1xuICAgICAgICBuZXcgTm90aWNlKCdcdTY1RTVcdTVGRDdcdTVERjJcdTRGRERcdTVCNTgnKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVsZXRlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgaWYgKCF3aW5kb3cuY29uZmlybSgnXHU1MjIwXHU5NjY0XHU4RkQ5XHU2NzYxXHU2NUU1XHU1RkQ3XHU1NDE3XHVGRjFGJykpIHJldHVybjtcbiAgICAgIGNvbnN0IHRhc2sgPSB0aGlzLnBsdWdpbi5nZXRUYXNrKHRoaXMudGFza0lkKTtcbiAgICAgIGlmICghdGFzaykgcmV0dXJuO1xuICAgICAgdGFzay5sb2dzID0gdGFzay5sb2dzLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5pZCAhPT0gbG9nLmlkKTtcbiAgICAgIHZvaWQgdGhpcy5wbHVnaW4uc2F2ZVRhc2sodGFzaykudGhlbigoKSA9PiB0aGlzLnJlbmRlcigpKTtcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBBbGxUYXNrc01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IFRhc2tCb2FyZFBsdWdpbikgeyBzdXBlcihhcHApOyB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMuYXBwbHlCYWNrZHJvcEJsdXIoKTtcbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoJ3Rhc2stYm9hcmQtYWxsLXRhc2tzLW1vZGFsJyk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cblxuICBwcml2YXRlIGFwcGx5QmFja2Ryb3BCbHVyKCk6IHZvaWQge1xuICAgIHRoaXMubW9kYWxFbC5wYXJlbnRFbGVtZW50Py5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignLm1vZGFsLWJnJyk/LmNsYXNzTGlzdC5hZGQoJ3Rhc2stYm9hcmQtbW9kYWwtYmFja2Ryb3AnKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGVudEVsO1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIHRoaXMuc2V0VGl0bGUoJ1x1NjYzRVx1NzkzQVx1NjI0MFx1NjcwOVx1NEVGQlx1NTJBMScpO1xuXG4gICAgY29uc3Qgc2VhcmNoID0gY29udGFpbmVyLmNyZWF0ZUVsKCdpbnB1dCcsIHtcbiAgICAgIHR5cGU6ICdzZWFyY2gnLFxuICAgICAgcGxhY2Vob2xkZXI6ICdcdTY0MUNcdTdEMjJcdTRFRkJcdTUyQTFcdTU0MERcdTc5RjBcdTMwMDFcdTVDNUVcdTYwMjdcdTMwMDFcdTY4MDdcdTdCN0VcdTIwMjZcdTIwMjYnLFxuICAgICAgY2xzOiAndGFzay1ib2FyZC10YXNrLXNlYXJjaCcsXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0ID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stYWxsLWxpc3QnIH0pO1xuXG4gICAgY29uc3QgZHJhdyA9ICgpID0+IHtcbiAgICAgIGxpc3QuZW1wdHkoKTtcbiAgICAgIGNvbnN0IGtleXdvcmQgPSBzZWFyY2gudmFsdWUudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCB0YXNrcyA9IHRoaXMucGx1Z2luLmRhdGEudGFza3MuZmlsdGVyKCh0YXNrKSA9PiB7XG4gICAgICAgIGlmICgha2V5d29yZCkgcmV0dXJuIHRydWU7XG4gICAgICAgIGNvbnN0IHByb3BlcnR5ID0gZ2V0UHJvcGVydHkodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncywgdGFzay5wcm9wZXJ0eUlkKTtcbiAgICAgICAgcmV0dXJuIFt0YXNrLnRpdGxlLCBwcm9wZXJ0eS5uYW1lLCAuLi50YXNrLnRhZ3NdLmpvaW4oJyAnKS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGtleXdvcmQpO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGFjdGl2ZSA9IHRhc2tzLmZpbHRlcigodGFzaykgPT4gIXRhc2suY29tcGxldGVkKTtcbiAgICAgIGNvbnN0IGNvbXBsZXRlZCA9IHRhc2tzLmZpbHRlcigodGFzaykgPT4gdGFzay5jb21wbGV0ZWQpO1xuICAgICAgdGhpcy5yZW5kZXJTZWN0aW9uKGxpc3QsICdcdTRFRkJcdTUyQTEnLCBhY3RpdmUpO1xuICAgICAgdGhpcy5yZW5kZXJTZWN0aW9uKGxpc3QsICdcdTVERjJcdTVCOENcdTYyMTBcdTRFRkJcdTUyQTEnLCBjb21wbGV0ZWQpO1xuICAgIH07XG5cbiAgICBzZWFyY2guYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBkcmF3KTtcbiAgICBkcmF3KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclNlY3Rpb24oY29udGFpbmVyOiBIVE1MRWxlbWVudCwgdGl0bGU6IHN0cmluZywgdGFza3M6IFRhc2tbXSk6IHZvaWQge1xuICAgIGNvbnN0IHNlY3Rpb24gPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1hbGwtc2VjdGlvbicgfSk7XG4gICAgc2VjdGlvbi5jcmVhdGVEaXYoeyB0ZXh0OiBgJHt0aXRsZX0gXHUwMEI3ICR7dGFza3MubGVuZ3RofWAsIGNsczogJ3Rhc2stYWxsLXNlY3Rpb24tdGl0bGUnIH0pO1xuXG4gICAgaWYgKHRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2VjdGlvbi5jcmVhdGVEaXYoeyB0ZXh0OiAnXHU2Q0ExXHU2NzA5XHU0RUZCXHU1MkExXHUzMDAyJywgY2xzOiAndGFzay1tb2RhbC1lbXB0eS1sb2dzJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0YXNrcy5mb3JFYWNoKCh0YXNrKSA9PiB7XG4gICAgICBjb25zdCBwcm9wZXJ0eSA9IGdldFByb3BlcnR5KHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MsIHRhc2sucHJvcGVydHlJZCk7XG4gICAgICBjb25zdCByb3cgPSBzZWN0aW9uLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stYWxsLXJvdycgfSk7XG4gICAgICByb3cuc3R5bGUuc2V0UHJvcGVydHkoJy0tdGFzay1jb2xvcicsIHByb3BlcnR5LmNvbG9yKTtcblxuICAgICAgY29uc3QgbWFpbiA9IHJvdy5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWFsbC1yb3ctbWFpbicgfSk7XG4gICAgICBtYWluLmNyZWF0ZURpdih7IHRleHQ6IHRhc2sudGl0bGUsIGNsczogJ3Rhc2stYWxsLXJvdy10aXRsZScgfSk7XG4gICAgICBjb25zdCBtZXRhID0gbWFpbi5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWFsbC1yb3ctbWV0YScgfSk7XG4gICAgICBtZXRhLmNyZWF0ZVNwYW4oeyB0ZXh0OiBwcm9wZXJ0eS5uYW1lIH0pO1xuICAgICAgdGFzay50YWdzLmZvckVhY2goKHRhZykgPT4gbWV0YS5jcmVhdGVTcGFuKHsgdGV4dDogYCMke3RhZ31gLCBjbHM6ICd0YXNrLWJvYXJkLXRhZycgfSkpO1xuICAgICAgaWYgKHRhc2suY29tcGxldGVkKSBtZXRhLmNyZWF0ZVNwYW4oeyB0ZXh0OiAnXHU1REYyXHU1QjhDXHU2MjEwJywgY2xzOiAndGFzay1jYXJkLWNvbXBsZXRlZC1iYWRnZScgfSk7XG5cbiAgICAgIGNvbnN0IHVwZGF0ZWQgPSBtYWluLmNyZWF0ZURpdih7IHRleHQ6IGBcdTY3MDBcdThGRDFcdTdGMTZcdThGOTEgJHtmb3JtYXREYXRlKHRhc2sudXBkYXRlZEF0KX1gLCBjbHM6ICd0YXNrLWFsbC1yb3ctdGltZScgfSk7XG5cbiAgICAgIGNvbnN0IHNob3dMYWJlbCA9IHJvdy5jcmVhdGVFbCgnbGFiZWwnLCB7IGNsczogJ3Rhc2stYWxsLXNob3ctY29udHJvbCcgfSk7XG4gICAgICBzaG93TGFiZWwuY3JlYXRlU3Bhbih7IHRleHQ6ICdcdTY2M0VcdTc5M0EnIH0pO1xuICAgICAgY29uc3QgY2hlY2tib3ggPSBzaG93TGFiZWwuY3JlYXRlRWwoJ2lucHV0JywgeyB0eXBlOiAnY2hlY2tib3gnIH0pO1xuICAgICAgY2hlY2tib3guY2hlY2tlZCA9IHRhc2sudmlzaWJsZU9uQm9hcmQ7XG4gICAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkpO1xuICAgICAgY2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICB0YXNrLnZpc2libGVPbkJvYXJkID0gY2hlY2tib3guY2hlY2tlZDtcbiAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlVGFzayh0YXNrKS50aGVuKCgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGlmICh0YXJnZXQgPT09IGNoZWNrYm94IHx8IHRhcmdldC5jbG9zZXN0KCcudGFzay1hbGwtc2hvdy1jb250cm9sJykpIHJldHVybjtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICBuZXcgVGFza01vZGFsKHRoaXMuYXBwLCB0aGlzLnBsdWdpbiwgdGFzay5pZCkub3BlbigpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgTWVtb1ZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgc2VsZWN0ZWRUb3BpY0lkID0gJyc7XG5cbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IFRhc2tCb2FyZFBsdWdpbikgeyBzdXBlcihsZWFmKTsgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBWSUVXX1RZUEVfTUVNTzsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gJ1x1NTkwN1x1NUZEOFx1NUY1NSc7IH1cbiAgZ2V0SWNvbigpOiBzdHJpbmcgeyByZXR1cm4gJ25vdGVib29rLXBlbic7IH1cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4geyB0aGlzLnJlbmRlcigpOyB9XG4gIGFzeW5jIG9uQ2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cblxuICByZW5kZXIoKTogdm9pZCB7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuY29udGVudEVsO1xuICAgIHJvb3QuZW1wdHkoKTtcbiAgICByb290LmFkZENsYXNzKCd0YXNrLW1lbW8tdmlldycpO1xuXG4gICAgY29uc3QgaGVhZGVyID0gcm9vdC5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWJvYXJkLWhlYWRlcicgfSk7XG4gICAgY29uc3QgaGVhZGVyVGV4dCA9IGhlYWRlci5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLWJvYXJkLWhlYWRlci10ZXh0JyB9KTtcbiAgICBoZWFkZXJUZXh0LmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogJ1x1NTkwN1x1NUZEOFx1NUY1NScsIGNsczogJ3Rhc2stYm9hcmQtaGVhZGluZycgfSk7XG4gICAgaGVhZGVyVGV4dC5jcmVhdGVEaXYoeyB0ZXh0OiAnXHU0RTNCXHU5ODk4IFx1MjE5MiBcdTU5MUFcdTRFMkFcdTdCMTRcdThCQjAnLCBjbHM6ICd0YXNrLWJvYXJkLXN1YnRpdGxlJyB9KTtcbiAgICBjb25zdCBhY3Rpb25zID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stYm9hcmQtaGVhZGVyLWFjdGlvbnMnIH0pO1xuICAgIGNvbnN0IGFkZFRvcGljID0gYWN0aW9ucy5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnKyBcdTZERkJcdTUyQTBcdTRFM0JcdTk4OTgnLCBjbHM6ICd0YXNrLWJvYXJkLXNlY29uZGFyeS1idXR0b24nIH0pO1xuICAgIGFkZFRvcGljLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbmV3IFRleHRJbnB1dE1vZGFsKHRoaXMuYXBwLCAnXHU2REZCXHU1MkEwXHU0RTNCXHU5ODk4JywgJ1x1OEY5M1x1NTE2NVx1NEUzQlx1OTg5OFx1NTQwRFx1NzlGMCcsIGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IHRvcGljOiBNZW1vVG9waWMgPSB7IGlkOiBjcmVhdGVJZCgndG9waWMnKSwgb3JkZXI6IHRoaXMucGx1Z2luLmRhdGEubWVtb1RvcGljcy5sZW5ndGgsIHRpdGxlOiB2YWx1ZSwgcGlubmVkOiBmYWxzZSwgbm90ZXM6IFtdLCBjcmVhdGVkQXQ6IG5vdywgdXBkYXRlZEF0OiBub3cgfTtcbiAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5tZW1vVG9waWNzLnB1c2godG9waWMpO1xuICAgICAgICB0aGlzLnNlbGVjdGVkVG9waWNJZCA9IHRvcGljLmlkO1xuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSkub3BlbigpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgbGF5b3V0ID0gcm9vdC5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLW1lbW8tbGF5b3V0JyB9KTtcbiAgICBjb25zdCB0b3BpY3NQYW5lID0gbGF5b3V0LmNyZWF0ZURpdih7IGNsczogJ3Rhc2stbWVtby10b3BpY3MnIH0pO1xuICAgIHRvcGljc1BhbmUuY3JlYXRlRGl2KHsgdGV4dDogJ1x1NEUzQlx1OTg5OCcsIGNsczogJ3Rhc2stbWVtby1wYW5lLXRpdGxlJyB9KTtcblxuICAgIGlmICh0aGlzLnBsdWdpbi5kYXRhLm1lbW9Ub3BpY3MubGVuZ3RoID09PSAwKSB7XG4gICAgICB0b3BpY3NQYW5lLmNyZWF0ZURpdih7IHRleHQ6ICdcdThGRDhcdTZDQTFcdTY3MDlcdTRFM0JcdTk4OThcdTMwMDInLCBjbHM6ICd0YXNrLW1vZGFsLWVtcHR5LWxvZ3MnIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHNvcnRlZFRvcGljcyA9IFsuLi50aGlzLnBsdWdpbi5kYXRhLm1lbW9Ub3BpY3NdLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGlmIChhLnBpbm5lZCAhPT0gYi5waW5uZWQpIHJldHVybiBhLnBpbm5lZCA/IC0xIDogMTtcbiAgICAgIHJldHVybiBhLm9yZGVyIC0gYi5vcmRlcjtcbiAgICB9KTtcblxuICAgIHNvcnRlZFRvcGljcy5mb3JFYWNoKCh0b3BpYykgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gdG9waWNzUGFuZS5jcmVhdGVEaXYoeyBjbHM6IGB0YXNrLW1lbW8tdG9waWMtcm93JHt0b3BpYy5pZCA9PT0gdGhpcy5zZWxlY3RlZFRvcGljSWQgPyAnIGlzLXNlbGVjdGVkJyA6ICcnfSR7dG9waWMucGlubmVkID8gJyBpcy1waW5uZWQnIDogJyd9YCB9KTtcbiAgICAgIGxldCBkaWREcmFnID0gZmFsc2U7XG4gICAgICBjb25zdCB0aXRsZVJvdyA9IHJvdy5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLW1lbW8tdG9waWMtdGl0bGUtcm93JyB9KTtcbiAgICAgIHRpdGxlUm93LmNyZWF0ZURpdih7IHRleHQ6IHRvcGljLnRpdGxlLCBjbHM6ICd0YXNrLW1lbW8tdG9waWMtdGl0bGUnIH0pO1xuICAgICAgaWYgKHRvcGljLnBpbm5lZCkgdGl0bGVSb3cuY3JlYXRlU3Bhbih7IHRleHQ6ICdcdUQ4M0RcdURDQ0MnLCBjbHM6ICd0YXNrLW1lbW8tdG9waWMtcGluJyB9KTtcbiAgICAgIHJvdy5jcmVhdGVEaXYoeyB0ZXh0OiBgJHt0b3BpYy5ub3Rlcy5sZW5ndGh9IFx1Njc2MVx1N0IxNFx1OEJCMGAsIGNsczogJ3Rhc2stbWVtby10b3BpYy1jb3VudCcgfSk7XG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGlmIChkaWREcmFnKSByZXR1cm47XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRUb3BpY0lkID0gdG9waWMuaWQ7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICAgIHJvdy5kcmFnZ2FibGUgPSB0cnVlO1xuICAgICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZGlkRHJhZyA9IHRydWU7XG4gICAgICAgIHJvdy5hZGRDbGFzcygnaXMtZHJhZ2dpbmcnKTtcbiAgICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyPy5zZXREYXRhKCd0ZXh0L3Rhc2stYm9hcmQtdG9waWMtaWQnLCB0b3BpYy5pZCk7XG4gICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnO1xuICAgICAgfSk7XG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgZHJhZ2dlZElkID0gZXZlbnQuZGF0YVRyYW5zZmVyPy50eXBlcy5pbmNsdWRlcygndGV4dC90YXNrLWJvYXJkLXRvcGljLWlkJyk7XG4gICAgICAgIGlmICghZHJhZ2dlZElkKSByZXR1cm47XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJvdy5hZGRDbGFzcygnaXMtZHJhZy1vdmVyJyk7XG4gICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ21vdmUnO1xuICAgICAgfSk7XG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2xlYXZlJywgKCkgPT4gcm93LnJlbW92ZUNsYXNzKCdpcy1kcmFnLW92ZXInKSk7XG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsICgpID0+IHtcbiAgICAgICAgcm93LnJlbW92ZUNsYXNzKCdpcy1kcmFnZ2luZycpO1xuICAgICAgICByb3cucmVtb3ZlQ2xhc3MoJ2lzLWRyYWctb3ZlcicpO1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7IGRpZERyYWcgPSBmYWxzZTsgfSwgMjUwKTtcbiAgICAgIH0pO1xuICAgICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHJvdy5yZW1vdmVDbGFzcygnaXMtZHJhZy1vdmVyJyk7XG4gICAgICAgIGNvbnN0IGRyYWdnZWRJZCA9IGV2ZW50LmRhdGFUcmFuc2Zlcj8uZ2V0RGF0YSgndGV4dC90YXNrLWJvYXJkLXRvcGljLWlkJyk7XG4gICAgICAgIGlmIChkcmFnZ2VkSWQpIHZvaWQgdGhpcy5wbHVnaW4ucmVvcmRlck1lbW9Ub3BpY3MoZHJhZ2dlZElkLCB0b3BpYy5pZCk7XG4gICAgICB9KTtcbiAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5zaG93VG9waWNDb250ZXh0TWVudShldmVudCwgdG9waWMpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBsZXQgdG9waWMgPSB0aGlzLnBsdWdpbi5kYXRhLm1lbW9Ub3BpY3MuZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gdGhpcy5zZWxlY3RlZFRvcGljSWQpO1xuICAgIGlmICghdG9waWMpIHRvcGljID0gdGhpcy5wbHVnaW4uZGF0YS5tZW1vVG9waWNzWzBdO1xuICAgIGlmICh0b3BpYykgdGhpcy5zZWxlY3RlZFRvcGljSWQgPSB0b3BpYy5pZDtcblxuICAgIGNvbnN0IG5vdGVzUGFuZSA9IGxheW91dC5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLW1lbW8tbm90ZXMnIH0pO1xuICAgIGNvbnN0IG5vdGVIZWFkZXIgPSBub3Rlc1BhbmUuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1tZW1vLW5vdGVzLWhlYWRlcicgfSk7XG4gICAgbm90ZUhlYWRlci5jcmVhdGVEaXYoeyB0ZXh0OiB0b3BpYz8udGl0bGUgPz8gJ1x1OEJGN1x1OTAwOVx1NjJFOVx1NEUzQlx1OTg5OCcsIGNsczogJ3Rhc2stbWVtby1wYW5lLXRpdGxlJyB9KTtcblxuICAgIGNvbnN0IGFkZE5vdGUgPSBub3RlSGVhZGVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICcrIFx1NkRGQlx1NTJBMFx1N0IxNFx1OEJCMCcsIGNsczogJ3Rhc2stYm9hcmQtc2Vjb25kYXJ5LWJ1dHRvbicgfSk7XG4gICAgYWRkTm90ZS5kaXNhYmxlZCA9ICF0b3BpYztcbiAgICBhZGROb3RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgaWYgKCF0b3BpYykgcmV0dXJuO1xuICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIGNvbnN0IG5vdGU6IE1lbW9Ob3RlID0geyBpZDogY3JlYXRlSWQoJ25vdGUnKSwgb3JkZXI6IDAsIGNvbnRlbnQ6ICcnLCBjcmVhdGVkQXQ6IG5vdywgdXBkYXRlZEF0OiBub3cgfTtcbiAgICAgIG5vdGUub3JkZXIgPSB0b3BpYy5ub3Rlcy5sZW5ndGg7XG4gICAgICB0b3BpYy5ub3Rlcy5wdXNoKG5vdGUpO1xuICAgICAgdG9waWMudXBkYXRlZEF0ID0gbm93O1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICBuZXcgTWVtb05vdGVNb2RhbCh0aGlzLmFwcCwgdGhpcy5wbHVnaW4sIHRvcGljIS5pZCwgbm90ZS5pZCkub3BlbigpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAodG9waWMpIHtcbiAgICAgIGNvbnN0IG5vdGVMaXN0ID0gbm90ZXNQYW5lLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stbWVtby1ub3RlLWxpc3QnIH0pO1xuICAgICAgWy4uLnRvcGljLm5vdGVzXVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gYS5vcmRlciAtIGIub3JkZXIpXG4gICAgICAgIC5mb3JFYWNoKChub3RlKSA9PiB7XG4gICAgICAgICAgY29uc3QgY2FyZCA9IG5vdGVMaXN0LmNyZWF0ZURpdih7IGNsczogJ3Rhc2stbWVtby1ub3RlLWNhcmQnIH0pO1xuICAgICAgICAgIGxldCBkaWREcmFnID0gZmFsc2U7XG4gICAgICAgICAgY29uc3QgZmlyc3RMaW5lID0gbm90ZS5jb250ZW50LnRyaW0oKS5zcGxpdCgvXFxyP1xcbi8pLmZpbmQoKGxpbmUpID0+IGxpbmUudHJpbSgpKT8udHJpbSgpID8/ICcnO1xuICAgICAgICAgIGNhcmQuY3JlYXRlRGl2KHsgdGV4dDogZmlyc3RMaW5lID8gZmlyc3RMaW5lLnNsaWNlKDAsIDQwKSA6ICdcdTY1QjBcdTdCMTRcdThCQjAnLCBjbHM6ICd0YXNrLW1lbW8tbm90ZS10aXRsZScgfSk7XG4gICAgICAgICAgY2FyZC5jcmVhdGVEaXYoeyB0ZXh0OiBub3RlLmNvbnRlbnQgfHwgJ1x1OEZEOFx1NkNBMVx1NjcwOVx1NTE4NVx1NUJCOVx1MzAwMicsIGNsczogJ3Rhc2stbWVtby1ub3RlLXByZXZpZXcnIH0pO1xuICAgICAgICAgIGNhcmQuY3JlYXRlRGl2KHsgdGV4dDogYFx1NTIxQlx1NUVGQVx1NEU4RSAke2Zvcm1hdERhdGUobm90ZS5jcmVhdGVkQXQpfSBcdTAwQjcgXHU3RjE2XHU4RjkxXHU0RThFICR7Zm9ybWF0RGF0ZShub3RlLnVwZGF0ZWRBdCl9YCwgY2xzOiAndGFzay1tZW1vLW5vdGUtdGltZScgfSk7XG4gICAgICAgICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIGlmIChkaWREcmFnKSByZXR1cm47XG4gICAgICAgICAgICBuZXcgTWVtb05vdGVNb2RhbCh0aGlzLmFwcCwgdGhpcy5wbHVnaW4sIHRvcGljIS5pZCwgbm90ZS5pZCkub3BlbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNhcmQuZHJhZ2dhYmxlID0gdHJ1ZTtcbiAgICAgICAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBkaWREcmFnID0gdHJ1ZTtcbiAgICAgICAgICAgIGNhcmQuYWRkQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7XG4gICAgICAgICAgICBldmVudC5kYXRhVHJhbnNmZXI/LnNldERhdGEoJ3RleHQvdGFzay1ib2FyZC1ub3RlLWlkJywgbm90ZS5pZCk7XG4gICAgICAgICAgICBldmVudC5kYXRhVHJhbnNmZXI/LnNldERhdGEoJ3RleHQvdGFzay1ib2FyZC10b3BpYy1pZCcsIHRvcGljIS5pZCk7XG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSBldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9ICdtb3ZlJztcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoIWV2ZW50LmRhdGFUcmFuc2Zlcj8udHlwZXMuaW5jbHVkZXMoJ3RleHQvdGFzay1ib2FyZC1ub3RlLWlkJykpIHJldHVybjtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjYXJkLmFkZENsYXNzKCdpcy1kcmFnLW92ZXInKTtcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ21vdmUnO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2xlYXZlJywgKCkgPT4gY2FyZC5yZW1vdmVDbGFzcygnaXMtZHJhZy1vdmVyJykpO1xuICAgICAgICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgIGNhcmQucmVtb3ZlQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7XG4gICAgICAgICAgICBjYXJkLnJlbW92ZUNsYXNzKCdpcy1kcmFnLW92ZXInKTtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHsgZGlkRHJhZyA9IGZhbHNlOyB9LCAyNTApO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgY2FyZC5yZW1vdmVDbGFzcygnaXMtZHJhZy1vdmVyJyk7XG4gICAgICAgICAgICBjb25zdCBkcmFnZ2VkSWQgPSBldmVudC5kYXRhVHJhbnNmZXI/LmdldERhdGEoJ3RleHQvdGFzay1ib2FyZC1ub3RlLWlkJyk7XG4gICAgICAgICAgICBjb25zdCBzb3VyY2VUb3BpY0lkID0gZXZlbnQuZGF0YVRyYW5zZmVyPy5nZXREYXRhKCd0ZXh0L3Rhc2stYm9hcmQtdG9waWMtaWQnKTtcbiAgICAgICAgICAgIGlmIChkcmFnZ2VkSWQgJiYgc291cmNlVG9waWNJZCA9PT0gdG9waWMhLmlkKSB7XG4gICAgICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ucmVvcmRlck1lbW9Ob3Rlcyh0b3BpYyEuaWQsIGRyYWdnZWRJZCwgbm90ZS5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5zaG93Tm90ZUNvbnRleHRNZW51KGV2ZW50LCB0b3BpYyEsIG5vdGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm90ZXNQYW5lLmNyZWF0ZURpdih7IHRleHQ6ICdcdTUxNDhcdTUyMUJcdTVFRkFcdTRFMDBcdTRFMkFcdTRFM0JcdTk4OThcdTMwMDInLCBjbHM6ICd0YXNrLW1lbW8tZW1wdHknIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2hvd1RvcGljQ29udGV4dE1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQsIHRvcGljOiBNZW1vVG9waWMpOiB2b2lkIHtcbiAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUodG9waWMucGlubmVkID8gJ1x1NTNENlx1NkQ4OFx1NTZGQVx1NUI5QScgOiAnUGluIC8gXHU1NkZBXHU1QjlBJykub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgIHRvcGljLnBpbm5lZCA9ICF0b3BpYy5waW5uZWQ7XG4gICAgICAgIHRvcGljLnVwZGF0ZWRBdCA9IERhdGUubm93KCk7XG4gICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5zZXRUaXRsZSgnXHU5MUNEXHU1NDdEXHU1NDBEJykub25DbGljaygoKSA9PiB7XG4gICAgICAgIG5ldyBUZXh0SW5wdXRNb2RhbChcbiAgICAgICAgICB0aGlzLmFwcCxcbiAgICAgICAgICAnXHU5MUNEXHU1NDdEXHU1NDBEXHU0RTNCXHU5ODk4JyxcbiAgICAgICAgICAnXHU4RjkzXHU1MTY1XHU2NUIwXHU3Njg0XHU0RTNCXHU5ODk4XHU1NDBEXHU3OUYwJyxcbiAgICAgICAgICBhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRvcGljLnRpdGxlID0gdmFsdWU7XG4gICAgICAgICAgICB0b3BpYy51cGRhdGVkQXQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgKS5vcGVuKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5zZXRUaXRsZSgnXHU2REZCXHU1MkEwXHU3QjE0XHU4QkIwJykub25DbGljaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IG5vdGU6IE1lbW9Ob3RlID0geyBpZDogY3JlYXRlSWQoJ25vdGUnKSwgb3JkZXI6IDAsIGNvbnRlbnQ6ICcnLCBjcmVhdGVkQXQ6IG5vdywgdXBkYXRlZEF0OiBub3cgfTtcbiAgICAgICAgbm90ZS5vcmRlciA9IHRvcGljLm5vdGVzLmxlbmd0aDtcbiAgICAgICAgdG9waWMubm90ZXMucHVzaChub3RlKTtcbiAgICAgICAgdG9waWMudXBkYXRlZEF0ID0gbm93O1xuICAgICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICBuZXcgTWVtb05vdGVNb2RhbCh0aGlzLmFwcCwgdGhpcy5wbHVnaW4sIHRvcGljLmlkLCBub3RlLmlkKS5vcGVuKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUoJ1x1NTIyMFx1OTY2NFx1NEUzQlx1OTg5OCcpLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBvayA9IHdpbmRvdy5jb25maXJtKGBcdTc4NkVcdTVCOUFcdTUyMjBcdTk2NjRcdTRFM0JcdTk4OThcdTIwMUMke3RvcGljLnRpdGxlfVx1MjAxRFx1NTNDQVx1NTE3Nlx1NEUyRFx1NzY4NCAke3RvcGljLm5vdGVzLmxlbmd0aH0gXHU2NzYxXHU3QjE0XHU4QkIwXHU1NDE3XHVGRjFGYCk7XG4gICAgICAgIGlmICghb2spIHJldHVybjtcbiAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5tZW1vVG9waWNzID0gdGhpcy5wbHVnaW4uZGF0YS5tZW1vVG9waWNzLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5pZCAhPT0gdG9waWMuaWQpO1xuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFRvcGljSWQgPT09IHRvcGljLmlkKSB0aGlzLnNlbGVjdGVkVG9waWNJZCA9ICcnO1xuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICBuZXcgTm90aWNlKCdcdTRFM0JcdTk4OThcdTVERjJcdTUyMjBcdTk2NjQnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbWVudS5zaG93QXRNb3VzZUV2ZW50KGV2ZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgc2hvd05vdGVDb250ZXh0TWVudShldmVudDogTW91c2VFdmVudCwgdG9waWM6IE1lbW9Ub3BpYywgbm90ZTogTWVtb05vdGUpOiB2b2lkIHtcbiAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uc2V0VGl0bGUoJ1x1N0YxNlx1OEY5MVx1N0IxNFx1OEJCMCcpLm9uQ2xpY2soKCkgPT4gbmV3IE1lbW9Ob3RlTW9kYWwodGhpcy5hcHAsIHRoaXMucGx1Z2luLCB0b3BpYy5pZCwgbm90ZS5pZCkub3BlbigpKTtcbiAgICB9KTtcblxuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5zZXRUaXRsZSgnXHU1MjIwXHU5NjY0XHU3QjE0XHU4QkIwJykub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9rID0gd2luZG93LmNvbmZpcm0oJ1x1Nzg2RVx1NUI5QVx1NTIyMFx1OTY2NFx1OEZEOVx1Njc2MVx1N0IxNFx1OEJCMFx1NTQxN1x1RkYxRicpO1xuICAgICAgICBpZiAoIW9rKSByZXR1cm47XG4gICAgICAgIHRvcGljLm5vdGVzID0gdG9waWMubm90ZXMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmlkICE9PSBub3RlLmlkKTtcbiAgICAgICAgdG9waWMudXBkYXRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgbmV3IE5vdGljZSgnXHU3QjE0XHU4QkIwXHU1REYyXHU1MjIwXHU5NjY0Jyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIG1lbnUuc2hvd0F0TW91c2VFdmVudChldmVudCk7XG4gIH1cbn1cblxuY2xhc3MgTWVtb05vdGVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IFRhc2tCb2FyZFBsdWdpbixcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRvcGljSWQ6IHN0cmluZyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG5vdGVJZDogc3RyaW5nLFxuICApIHsgc3VwZXIoYXBwKTsgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLmFwcGx5QmFja2Ryb3BCbHVyKCk7XG4gICAgdGhpcy5tb2RhbEVsLmFkZENsYXNzKCd0YXNrLWJvYXJkLW1lbW8tbm90ZS1tb2RhbCcpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQgeyB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpOyB9XG5cbiAgcHJpdmF0ZSBhcHBseUJhY2tkcm9wQmx1cigpOiB2b2lkIHtcbiAgICB0aGlzLm1vZGFsRWwucGFyZW50RWxlbWVudD8ucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oJy5tb2RhbC1iZycpPy5jbGFzc0xpc3QuYWRkKCd0YXNrLWJvYXJkLW1vZGFsLWJhY2tkcm9wJyk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICBjb25zdCB0b3BpYyA9IHRoaXMucGx1Z2luLmRhdGEubWVtb1RvcGljcy5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSB0aGlzLnRvcGljSWQpO1xuICAgIGNvbnN0IG5vdGUgPSB0b3BpYz8ubm90ZXMuZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gdGhpcy5ub3RlSWQpO1xuICAgIGlmICghdG9waWMgfHwgIW5vdGUpIHtcbiAgICAgIHRoaXMuY29udGVudEVsLnNldFRleHQoJ1x1N0IxNFx1OEJCMFx1NEUwRFx1NUI1OFx1NTcyOFx1MzAwMicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5zZXRUaXRsZSgnXHU3RjE2XHU4RjkxXHU3QjE0XHU4QkIwJyk7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgdGV4dDogdG9waWMudGl0bGUsIGNsczogJ3Rhc2stbW9kYWwtbWV0YScgfSk7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbCgndGV4dGFyZWEnLCB7IGNsczogJ3Rhc2stbWVtby1ub3RlLWVkaXRvcicsIHBsYWNlaG9sZGVyOiAnXHU4QkIwXHU1RjU1XHU0RjYwXHU3Njg0XHU2MEYzXHU2Q0Q1XHUyMDI2XHUyMDI2JyB9KTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IG5vdGUuY29udGVudDtcblxuICAgIGNvbnN0IG1ldGEgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyB0ZXh0OiBgXHU1MjFCXHU1RUZBXHU0RThFICR7Zm9ybWF0RGF0ZShub3RlLmNyZWF0ZWRBdCl9IFx1MDBCNyBcdTRFMEFcdTZCMjFcdTdGMTZcdThGOTEgJHtmb3JtYXREYXRlKG5vdGUudXBkYXRlZEF0KX1gLCBjbHM6ICd0YXNrLW1vZGFsLW1ldGEnIH0pO1xuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICd0YXNrLW1vZGFsLWJvdHRvbS1hY3Rpb25zJyB9KTtcbiAgICBjb25zdCBzYXZlID0gYWN0aW9ucy5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnXHU0RkREXHU1QjU4JywgY2xzOiAnbW9kLWN0YScgfSk7XG4gICAgc2F2ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vdGUuY29udGVudCA9IHRleHRhcmVhLnZhbHVlO1xuICAgICAgbm90ZS51cGRhdGVkQXQgPSBEYXRlLm5vdygpO1xuICAgICAgdG9waWMudXBkYXRlZEF0ID0gbm90ZS51cGRhdGVkQXQ7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMucGx1Z2luLnJlZnJlc2hWaWV3cygpO1xuICAgICAgICBuZXcgTm90aWNlKCdcdTdCMTRcdThCQjBcdTVERjJcdTRGRERcdTVCNTgnKTtcbiAgICAgICAgbWV0YS5zZXRUZXh0KGBcdTUyMUJcdTVFRkFcdTRFOEUgJHtmb3JtYXREYXRlKG5vdGUuY3JlYXRlZEF0KX0gXHUwMEI3IFx1NEUwQVx1NkIyMVx1N0YxNlx1OEY5MSAke2Zvcm1hdERhdGUobm90ZS51cGRhdGVkQXQpfWApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgVGV4dElucHV0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGl0bGU6IHN0cmluZyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHBsYWNlaG9sZGVyOiBzdHJpbmcsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvblN1Ym1pdDogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+LFxuICApIHsgc3VwZXIoYXBwKTsgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnNldFRpdGxlKHRoaXMudGl0bGUpO1xuICAgIGNvbnN0IGlucHV0ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoJ2lucHV0JywgeyB0eXBlOiAndGV4dCcsIHBsYWNlaG9sZGVyOiB0aGlzLnBsYWNlaG9sZGVyIH0pO1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdm9pZCB0aGlzLnN1Ym1pdChpbnB1dC52YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc3QgYWN0aW9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3Rhc2stbW9kYWwtYm90dG9tLWFjdGlvbnMnIH0pO1xuICAgIGNvbnN0IGNhbmNlbCA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJ1x1NTNENlx1NkQ4OCcgfSk7XG4gICAgY29uc3Qgb2sgPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICdcdTc4NkVcdTVCOUEnLCBjbHM6ICdtb2QtY3RhJyB9KTtcbiAgICBjYW5jZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIG9rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdm9pZCB0aGlzLnN1Ym1pdChpbnB1dC52YWx1ZSkpO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IGlucHV0LmZvY3VzKCksIDApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHsgdGhpcy5jb250ZW50RWwuZW1wdHkoKTsgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3VibWl0KHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGVhbiA9IHZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIWNsZWFuKSB7XG4gICAgICBuZXcgTm90aWNlKCdcdThCRjdcdThGOTNcdTUxNjVcdTUxODVcdTVCQjknKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5vblN1Ym1pdChjbGVhbik7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9XG59XG5cbmNsYXNzIFN0YXRzVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IFRhc2tCb2FyZFBsdWdpbikgeyBzdXBlcihsZWFmKTsgfVxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcgeyByZXR1cm4gVklFV19UWVBFX1NUQVRTOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiAnXHU0RUZCXHU1MkExXHU3RURGXHU4QkExJzsgfVxuICBnZXRJY29uKCk6IHN0cmluZyB7IHJldHVybiAndGFibGUtcHJvcGVydGllcyc7IH1cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4geyB0aGlzLnJlbmRlcigpOyB9XG4gIGFzeW5jIG9uQ2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cblxuICByZW5kZXIoKTogdm9pZCB7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuY29udGVudEVsO1xuICAgIHJvb3QuZW1wdHkoKTtcbiAgICByb290LmFkZENsYXNzKCd0YXNrLXN0YXRzLXZpZXcnKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IHJvb3QuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1ib2FyZC1oZWFkZXInIH0pO1xuICAgIGNvbnN0IGhlYWRlclRleHQgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiAndGFzay1ib2FyZC1oZWFkZXItdGV4dCcgfSk7XG4gICAgaGVhZGVyVGV4dC5jcmVhdGVFbCgnaDInLCB7IHRleHQ6ICdcdTRFRkJcdTUyQTFcdTdFREZcdThCQTEnLCBjbHM6ICd0YXNrLWJvYXJkLWhlYWRpbmcnIH0pO1xuICAgIGhlYWRlclRleHQuY3JlYXRlRGl2KHsgdGV4dDogJ1x1N0VERlx1OEJBMVx1N0VGNFx1NUVBNlx1Njc2NVx1ODFFQVx1OEJCRVx1N0Y2RVx1NEUyRFx1NzY4NFx1NTE4NVx1N0Y2RVx1N0VGNFx1NUVBNlx1NTQ4Q1x1ODFFQVx1NUI5QVx1NEU0OVx1NEVGQlx1NTJBMVx1NjMwN1x1NjgwN1x1MzAwMicsIGNsczogJ3Rhc2stYm9hcmQtc3VidGl0bGUnIH0pO1xuICAgIGNvbnN0IHNldHRpbmdzQnV0dG9uID0gaGVhZGVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICdcdTYyNTNcdTVGMDBcdThCQkVcdTdGNkUnLCBjbHM6ICd0YXNrLWJvYXJkLXNlY29uZGFyeS1idXR0b24nIH0pO1xuICAgIHNldHRpbmdzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgLy8gT2JzaWRpYW4gXHU0RTBEXHU2M0QwXHU0RjlCXHU3NkY0XHU2M0E1XHU3Njg0XHUyMDFDXHU2MjUzXHU1RjAwXHU2MzA3XHU1QjlBXHU4QkJFXHU3RjZFXHU5ODc1XHUyMDFEXHU1MTZDXHU1MTcxIEFQSVx1RkYxQlx1OEZEOVx1OTFDQ1x1N0VEOVx1NTFGQVx1NjNEMFx1NzkzQVx1RkYwQ1x1OTA3Rlx1NTE0RFx1NEY5RFx1OEQ1Nlx1NTE4NVx1OTBFOCBBUElcdTMwMDJcbiAgICAgIG5ldyBOb3RpY2UoJ1x1OEJGN1x1NjI1M1x1NUYwMCBcdThCQkVcdTdGNkUgXHUyMTkyIFx1N0IyQ1x1NEUwOVx1NjVCOVx1NjNEMlx1NEVGNiBcdTIxOTIgVGFzayBCb2FyZCcpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZGltZW5zaW9ucyA9IHRoaXMuZ2V0RGltZW5zaW9ucygpO1xuICAgIGNvbnN0IHRhYmxlID0gcm9vdC5jcmVhdGVFbCgndGFibGUnLCB7IGNsczogJ3Rhc2stc3RhdHMtdGFibGUnIH0pO1xuICAgIGNvbnN0IHRoZWFkID0gdGFibGUuY3JlYXRlRWwoJ3RoZWFkJyk7XG4gICAgY29uc3QgaGVhZFJvdyA9IHRoZWFkLmNyZWF0ZUVsKCd0cicpO1xuICAgIGhlYWRSb3cuY3JlYXRlRWwoJ3RoJywgeyB0ZXh0OiAnXHU0RUZCXHU1MkExJyB9KTtcbiAgICBkaW1lbnNpb25zLmZvckVhY2goKGRpbWVuc2lvbikgPT4gaGVhZFJvdy5jcmVhdGVFbCgndGgnLCB7IHRleHQ6IGRpbWVuc2lvbi5uYW1lIH0pKTtcblxuICAgIGNvbnN0IHRib2R5ID0gdGFibGUuY3JlYXRlRWwoJ3Rib2R5Jyk7XG4gICAgdGhpcy5wbHVnaW4uZGF0YS50YXNrcy5mb3JFYWNoKCh0YXNrKSA9PiB7XG4gICAgICBjb25zdCB0ciA9IHRib2R5LmNyZWF0ZUVsKCd0cicpO1xuICAgICAgY29uc3QgdGFza0NlbGwgPSB0ci5jcmVhdGVFbCgndGQnLCB7IGNsczogJ3Rhc2stc3RhdHMtdGFzay1jZWxsJyB9KTtcbiAgICAgIGNvbnN0IHByb3BlcnR5ID0gZ2V0UHJvcGVydHkodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncywgdGFzay5wcm9wZXJ0eUlkKTtcbiAgICAgIHRhc2tDZWxsLmNyZWF0ZURpdih7IHRleHQ6IHRhc2sudGl0bGUsIGNsczogJ3Rhc2stc3RhdHMtdGFzay1uYW1lJyB9KTtcbiAgICAgIHRhc2tDZWxsLmNyZWF0ZURpdih7IHRleHQ6IGAke3Byb3BlcnR5Lm5hbWV9JHt0YXNrLmNvbXBsZXRlZCA/ICcgXHUwMEI3IFx1NURGMlx1NUI4Q1x1NjIxMCcgOiAnJ31gLCBjbHM6ICd0YXNrLXN0YXRzLXRhc2stbWV0YScgfSk7XG5cbiAgICAgIGRpbWVuc2lvbnMuZm9yRWFjaCgoZGltZW5zaW9uKSA9PiB7XG4gICAgICAgIGNvbnN0IHRkID0gdHIuY3JlYXRlRWwoJ3RkJywgeyBjbHM6ICd0YXNrLXN0YXRzLXZhbHVlLWNlbGwnIH0pO1xuICAgICAgICBpZiAoZGltZW5zaW9uLmlkID09PSAnY29tcGxldGVkJykgdGQuc2V0VGV4dCh0YXNrLmNvbXBsZXRlZCA/ICdcdTI3MTMnIDogJ1x1MjAxNCcpO1xuICAgICAgICBlbHNlIGlmIChkaW1lbnNpb24uaWQgPT09ICdsb2dDb3VudCcpIHRkLnNldFRleHQoU3RyaW5nKHRhc2subG9ncy5sZW5ndGgpKTtcbiAgICAgICAgZWxzZSBpZiAoZGltZW5zaW9uLmlkID09PSAndGFnQ291bnQnKSB0ZC5zZXRUZXh0KFN0cmluZyh0YXNrLnRhZ3MubGVuZ3RoKSk7XG4gICAgICAgIGVsc2UgdGQuc2V0VGV4dCh0YXNrLm1ldHJpY3NbZGltZW5zaW9uLmlkXSA/ICdcdTI3MTMnIDogJ1x1MjAxNCcpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uZGF0YS50YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IHRyID0gdGJvZHkuY3JlYXRlRWwoJ3RyJyk7XG4gICAgICBjb25zdCB0ZCA9IHRyLmNyZWF0ZUVsKCd0ZCcsIHsgdGV4dDogJ1x1NjY4Mlx1NjVFMFx1NEVGQlx1NTJBMVx1MzAwMicgfSk7XG4gICAgICB0ZC5jb2xTcGFuID0gZGltZW5zaW9ucy5sZW5ndGggKyAxO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0RGltZW5zaW9ucygpOiBBcnJheTx7IGlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZyB9PiB7XG4gICAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oW1xuICAgICAgWydjb21wbGV0ZWQnLCAnXHU1REYyXHU1QjhDXHU2MjEwJ10sXG4gICAgICBbJ2xvZ0NvdW50JywgJ1x1NjVFNVx1NUZEN1x1NjU3MFx1OTFDRiddLFxuICAgICAgWyd0YWdDb3VudCcsICdcdTY4MDdcdTdCN0VcdTY1NzBcdTkxQ0YnXSxcbiAgICBdKTtcbiAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1ldHJpY3MuZm9yRWFjaCgobWV0cmljKSA9PiBtYXAuc2V0KG1ldHJpYy5pZCwgbWV0cmljLm5hbWUpKTtcbiAgICByZXR1cm4gdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5zdGF0c0NvbHVtbnNcbiAgICAgIC5tYXAoKGlkKSA9PiAoeyBpZCwgbmFtZTogbWFwLmdldChpZCkgPz8gaWQgfSkpXG4gICAgICAuZmlsdGVyKChkaW1lbnNpb24sIGluZGV4LCBhcnJheSkgPT4gYXJyYXkuZmluZEluZGV4KChpdGVtKSA9PiBpdGVtLmlkID09PSBkaW1lbnNpb24uaWQpID09PSBpbmRleCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFZTztBQUVBLElBQU0sdUJBQXVCO0FBQzdCLElBQU0saUJBQWlCO0FBQ3ZCLElBQU0sa0JBQWtCO0FBdUUvQixJQUFNLHFCQUF3QztBQUFBLEVBQzVDLEVBQUUsSUFBSSxRQUFRLE1BQU0sZ0JBQU0sT0FBTyxVQUFVO0FBQUEsRUFD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QUFLLE9BQU8sS0FBSyxVQUFVLEtBQUssVUFBVTtBQUN2RSxlQUFTLFVBQVUsRUFBRSxNQUFNLEtBQUssT0FBTyxLQUFLLHVCQUF1QixDQUFDO0FBQ3BFLGVBQVMsVUFBVSxFQUFFLE1BQU0sR0FBRyxTQUFTLElBQUksR0FBRyxLQUFLLFlBQVksNkJBQVcsRUFBRSxJQUFJLEtBQUssdUJBQXVCLENBQUM7QUFFN0csaUJBQVcsUUFBUSxDQUFDLGNBQWM7QUFDaEMsY0FBTSxLQUFLLEdBQUcsU0FBUyxNQUFNLEVBQUUsS0FBSyx3QkFBd0IsQ0FBQztBQUM3RCxZQUFJLFVBQVUsT0FBTyxZQUFhLElBQUcsUUFBUSxLQUFLLFlBQVksV0FBTSxRQUFHO0FBQUEsaUJBQzlELFVBQVUsT0FBTyxXQUFZLElBQUcsUUFBUSxPQUFPLEtBQUssS0FBSyxNQUFNLENBQUM7QUFBQSxpQkFDaEUsVUFBVSxPQUFPLFdBQVksSUFBRyxRQUFRLE9BQU8sS0FBSyxLQUFLLE1BQU0sQ0FBQztBQUFBLFlBQ3BFLElBQUcsUUFBUSxLQUFLLFFBQVEsVUFBVSxFQUFFLElBQUksV0FBTSxRQUFHO0FBQUEsTUFDeEQsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVELFFBQUksS0FBSyxPQUFPLEtBQUssTUFBTSxXQUFXLEdBQUc7QUFDdkMsWUFBTSxLQUFLLE1BQU0sU0FBUyxJQUFJO0FBQzlCLFlBQU0sS0FBSyxHQUFHLFNBQVMsTUFBTSxFQUFFLE1BQU0saUNBQVEsQ0FBQztBQUM5QyxTQUFHLFVBQVUsV0FBVyxTQUFTO0FBQUEsSUFDbkM7QUFBQSxFQUNGO0FBQUEsRUFFUSxnQkFBcUQ7QUFDM0QsVUFBTSxNQUFNLG9CQUFJLElBQW9CO0FBQUEsTUFDbEMsQ0FBQyxhQUFhLG9CQUFLO0FBQUEsTUFDbkIsQ0FBQyxZQUFZLDBCQUFNO0FBQUEsTUFDbkIsQ0FBQyxZQUFZLDBCQUFNO0FBQUEsSUFDckIsQ0FBQztBQUNELFNBQUssT0FBTyxLQUFLLFNBQVMsUUFBUSxRQUFRLENBQUMsV0FBVyxJQUFJLElBQUksT0FBTyxJQUFJLE9BQU8sSUFBSSxDQUFDO0FBQ3JGLFdBQU8sS0FBSyxPQUFPLEtBQUssU0FBUyxhQUM5QixJQUFJLENBQUMsT0FBSTtBQW50RGhCO0FBbXREb0IsZUFBRSxJQUFJLE9BQU0sU0FBSSxJQUFJLEVBQUUsTUFBVixZQUFlLEdBQUc7QUFBQSxLQUFFLEVBQzdDLE9BQU8sQ0FBQyxXQUFXLE9BQU8sVUFBVSxNQUFNLFVBQVUsQ0FBQyxTQUFTLEtBQUssT0FBTyxVQUFVLEVBQUUsTUFBTSxLQUFLO0FBQUEsRUFDdEc7QUFDRjsiLAogICJuYW1lcyI6IFsiX2EiLCAiX2IiLCAiX2MiLCAiX2QiLCAiaXRlbSIsICJ0b3BpYyJdCn0K
