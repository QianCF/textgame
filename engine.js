(function () {
  "use strict";

  // 检查 Vue 是否已加载
  if (typeof Vue === "undefined") {
    throw new Error("Vue 未加载，请确保 vue.umd.js 已引入");
  }

  /** @type {Record<string, any>} */
  const 物品类列表 = Object.create(null);
  /** @type {Record<string, any>} */
  const 商店类列表 = Object.create(null);
  /** @type {Record<string, any>} */
  const 地点类列表 = Object.create(null);

  const defaultState = () => ({
    钱: 0,
    物品: [],
    所在地点: "起点",
    打开的商店: null,
    购买物品历史记录: [],
    进入商店历史记录: [],
    进入地点历史记录: [],
    其他状态栏: [],
  });

  // ---------- 全局提示/消息队列 ----------
  // 先创建普通数组，稍后在 Vue 初始化时转换为响应式
  let 消息队列 = [];
  function 提示(消息, 标题) {
    window.alert((标题 ? 标题 + "\n\n" : "") + (消息 ?? ""));
  }
  function 消息队列添加(消息, 标题) {
    消息队列.push({ 标题: 标题 || "消息", 消息: String(消息 ?? "") });
    // Vue 会自动更新，但为了兼容性仍然调用渲染
    if (vueApp) vueApp.$forceUpdate();
  }

  // ---------- 对话系统 ----------
  /** @type {null | any} */
  let 当前对话 = null;

  function 显示对话(对话列表实例) {
    当前对话 = {
      inst: 对话列表实例,
      idx: 0,
      inited: false,
      lastMsgKey: null, // 记录上次的消息键（用于检测消息是否变化）
    };
    响应式当前对话.value = 当前对话;
    // 触发watch，立即调用第一个消息的进入函数
    if (vueApp) {
      vueApp.$nextTick(() => {
        vueApp.handleDialogMsgEnter();
      });
    }
  }

  function 关闭对话() {
    当前对话 = null;
    响应式当前对话.value = null;
    if (vueApp) vueApp.$forceUpdate();
  }

  // ---------- 插件注入 API ----------
  function 注入物品类(cls) {
    const 名字 = cls.名字;
    if (!名字) throw new Error("注入物品类：类必须有一个 名字 属性");
    物品类列表[名字] = cls;
  }
  function 注入商店类(cls) {
    const 名字 = cls.名字;
    
    if (!名字) throw new Error("注入商店类：类必须有一个 名字 属性");
    商店类列表[名字] = cls;
  }
  function 注入地点类(cls) {
    const 名字 = cls.名字;
    if (!名字) throw new Error("注入地点类：类必须有一个 名字 属性");
    地点类列表[名字] = cls;
  }

  // ---------- 工具 ----------
  function safeCall(fn, ...args) {
    try {
      if (typeof fn === "function") return fn(...args);
    } catch (e) {
      消息队列添加(e && e.stack ? e.stack : String(e), "脚本异常");
      return false;
    }
  }

  function getLocationCls(name) {
    const cls = 地点类列表[name];
    if (!cls) throw new Error("未知地点：" + name);
    return cls;
  }
  function getShopCls(name) {
    const cls = 商店类列表[name];
    if (!cls) throw new Error("未知商店：" + name);
    return cls;
  }
  function getItemName(itemInst) {
    const cls = itemInst.constructor;
    return cls.名字 || cls.name || "物品";
  }
  function createItemInstance(itemName, itemData) {
    const Cls = 物品类列表[itemName];
    if (!Cls) throw new Error("未知物品：" + itemName);
    const inst = new Cls(itemData);
    return inst;
  }

  // ---------- 物品/商店/地点行为 ----------
  function 进入地点(地点名, 从点击进入 = false) {
    const from = 状态.所在地点;
    const fromCls = 地点类列表[from];
    const toCls = getLocationCls(地点名);

    // 检查是否允许进入
    // 参数约定： (cls, from地点名, fromCls, 从点击进入)
    const allow = safeCall(toCls.检查是否允许进入的js函数, toCls, from, fromCls || null, 从点击进入);
    if (allow === false) return false;

    // 离开旧地点
    // 参数约定： (cls, to地点名, toCls)
    safeCall(fromCls && fromCls.离开时执行的js函数, fromCls, 地点名, toCls);

    状态.所在地点 = 地点名;
    状态.打开的商店 = null;
    状态.进入地点历史记录.push({ 地点: 地点名, 时间: Date.now(), 从: from });

    // 参数约定： (cls, from地点名, fromCls, 从点击进入)
    safeCall(toCls.进入时执行的js函数, toCls, from, fromCls || null, 从点击进入);
    if (vueApp) vueApp.$forceUpdate();
    return true;
  }

  function 打开商店(商店名) {
    const shopCls = getShopCls(商店名);
    const prev = 状态.打开的商店;
    // 参数约定： (cls, nextShopCls)
    if (prev && 商店类列表[prev]) safeCall(商店类列表[prev].离开时执行的js函数, 商店类列表[prev], shopCls);

    状态.打开的商店 = 商店名;
    状态.进入商店历史记录.push({ 商店: 商店名, 时间: Date.now(), 地点: 状态.所在地点 });
    // 参数约定： (cls)
    safeCall(shopCls.进入时执行的js函数, shopCls);
    if (vueApp) vueApp.$forceUpdate();
  }

  function 关闭商店() {
    const prev = 状态.打开的商店;
    // 参数约定： (cls, nextShopCls)
    if (prev && 商店类列表[prev]) safeCall(商店类列表[prev].离开时执行的js函数, 商店类列表[prev], null);
    状态.打开的商店 = null;
    if (vueApp) vueApp.$forceUpdate();
  }

  function 购买物品(商店名, idx) {
    const shopCls = getShopCls(商店名);
    const dataList = shopCls.数据 || null;
    if (!dataList) throw new Error("商店没有数据");

    // 通过索引定位物品条目
    const data = dataList[idx];
    if (!data) throw new Error("商店没有该索引的物品：" + idx);

    const 价格 = Number(data.价格 ?? 0);
    if (Number.isNaN(价格) || 价格 < 0) throw new Error("非法价格：" + data.价格);
    if (状态.钱 < 价格) {
      消息队列添加("钱不够。", "购买失败");
      return false;
    }

    // 参数约定： (cls, 条目)
    const ok = safeCall(data.购买时执行的js函数, shopCls, data);
    if (ok === false) return false;

    状态.钱 -= 价格;
    const itemInst = createItemInstance(data.物品名, data.物品数据);
    状态.物品.push(itemInst);
    状态.购买物品历史记录.push({ 商店: 商店名, 物品: data.物品名, 价格, 时间: Date.now() });
    safeCall(itemInst.不持有到持有时执行的js函数, itemInst, 物品类列表[data.物品名], shopCls);
    if (vueApp) vueApp.$forceUpdate();
    return true;
  }

  function 卖出物品(itemInst) {
    const 价值 = Number(itemInst.卖掉的价值 ?? 0);
    if (Number.isNaN(价值) || 价值 < 0) throw new Error("非法卖价：" + itemInst.卖掉的价值);
    const itemCls = itemInst.constructor;
    // 参数约定： (thisArg, cls)
    // 返回 false：阻止卖出
    const ok = safeCall(itemInst.卖掉时执行的js函数, itemInst, itemCls);
    if (ok === false) return false;

    const idx = 状态.物品.indexOf(itemInst);
    if (idx >= 0) 状态.物品.splice(idx, 1);
    状态.钱 += 价值;
    // 参数约定： (thisArg, cls)
    safeCall(itemInst.持有到不持有时执行的js函数, itemInst, itemCls);
    if (vueApp) vueApp.$forceUpdate();
    return true;
  }

  function 使用物品(itemInst) {
    const itemCls = itemInst.constructor;
    const canUse =
      typeof itemInst.能否使用 === "function"
        ? safeCall(itemInst.能否使用, itemInst, itemCls) !== false
        : !!itemInst.能否使用;
    if (!canUse) {
      消息队列添加("该物品现在不能使用。", "无法使用");
      return false;
    }
    // 参数约定： (thisArg, cls)
    // 返回 false：阻止使用（不消耗、不结算）
    const ok = safeCall(itemInst.使用后执行的js函数, itemInst, itemCls);
    if (ok === false) return false;
    if (vueApp) vueApp.$forceUpdate();
    return true;
  }

  // ---------- Vue 应用 ----------
  let vueApp = null;
  /** @type {any} */
  const 状态 = Vue.observable(defaultState());
  
  // 使消息队列响应式
  // Vue.observable 会返回响应式对象，我们需要让消息队列引用它
  const 响应式消息队列 = Vue.observable(消息队列);
  // 让消息队列变量指向响应式数组，这样后续的 push 操作都会在响应式数组上
  消息队列 = 响应式消息队列;
  
  // 使当前对话响应式
  let 响应式当前对话 = Vue.observable({ value: null });

  // 渲染函数（保持接口一致，内部使用 Vue 自动更新）
  function 渲染() {
    // Vue 会自动响应式更新，但为了确保更新，调用 $forceUpdate
    if (vueApp) {
      vueApp.$forceUpdate();
    }
  }

  // 创建 Vue 应用
  function createVueApp() {
    vueApp = new Vue({
      el: "#app",
      data: {
        状态,
        消息队列: 响应式消息队列,
        当前对话: 响应式当前对话,
      },
      watch: {
        // 确保消息队列变化时触发更新
        '消息队列.length'() {
          this.$forceUpdate();
        },
        // 监听对话idx变化，立即调用进入时调用的js函数
        '当前对话': {
          handler() {
            this.handleDialogMsgEnter();
          },
          deep: true, // 深度监听，监听对象内部变化（包括idx和消息数组）
          immediate: true, // 立即执行一次，确保首次显示对话时也调用进入函数
        },
      },
      computed: {
        对话中() {
          return !!响应式当前对话.value;
        },
        其他状态栏() {
          return Array.isArray(状态.其他状态栏) ? 状态.其他状态栏 : [];
        },
        locCls() {
          try {
            return getLocationCls(状态.所在地点);
          } catch (e) {
            return null;
          }
        },
        locationLinks() {
          const locCls = this.locCls;
          if (!locCls || !locCls.数据) return [];
          return Array.isArray(locCls.数据.指向地点) ? locCls.数据.指向地点 : [];
        },
        locationShops() {
          const locCls = this.locCls;
          if (!locCls || !locCls.数据) return [];
          return Array.isArray(locCls.数据.商店) ? locCls.数据.商店 : [];
        },
        locationButtons() {
          const locCls = this.locCls;
          if (!locCls || !locCls.数据) return [];
          return Array.isArray(locCls.数据.按钮) ? locCls.数据.按钮 : [];
        },
        locationError() {
          try {
            getLocationCls(状态.所在地点);
            return null;
          } catch (e) {
            return "地点渲染失败：" + String(e);
          }
        },
        shopInfo() {
          if (!状态.打开的商店) return "";
          try {
            const shopCls = getShopCls(状态.打开的商店);
            return (shopCls.名字 || 状态.打开的商店) + " - " + (shopCls.显示的文本 || "");
          } catch (e) {
            return "商店渲染失败：" + String(e);
          }
        },
        shopDataList() {
          if (!状态.打开的商店) return [];
          try {
            const shopCls = getShopCls(状态.打开的商店);
            return shopCls.数据 || [];
          } catch (e) {
            return [];
          }
        },
        shopError() {
          if (!状态.打开的商店) return null;
          try {
            getShopCls(状态.打开的商店);
            return null;
          } catch (e) {
            return "商店渲染失败：" + String(e);
          }
        },
        dialogTitle() {
          if (!响应式当前对话.value) return "";
          return 响应式当前对话.value.inst.标题 || "对话";
        },
        currentDialogMsg() {
          if (!响应式当前对话.value) return null;
          const list = Array.isArray(响应式当前对话.value.inst.消息) ? 响应式当前对话.value.inst.消息 : [];
          return list[响应式当前对话.value.idx] || null;
        },
        dialogContent() {
          const msg = this.currentDialogMsg;
          if (!msg) return "";
          return (msg.人名 ? msg.人名 + "：" : "") + (msg.内容 || "");
        },
        dialogButtons() {
          const msg = this.currentDialogMsg;
          if (!msg) return [];
          return Array.isArray(msg.按钮) ? msg.按钮 : [];
        },
      },
      methods: {
        // 处理对话消息进入函数
        handleDialogMsgEnter() {
          if (!响应式当前对话.value) return;
          const newMsg = this.currentDialogMsg;
          if (!newMsg) return;
          
          const inst = 响应式当前对话.value.inst;
          const idx = 响应式当前对话.value.idx;
          
          // 如果idx变化了或消息数组变化了，调用进入函数
          // 使用initedMsgIdx标记确保每个消息只调用一次进入函数
          // 但如果是消息数组变化（消息被替换），需要重新调用
          const msgKey = idx + '_' + (newMsg.内容 || '') + '_' + (newMsg.人名 || '');
          if (响应式当前对话.value.lastMsgKey !== msgKey) {
            响应式当前对话.value.lastMsgKey = msgKey;
            // 立即调用进入函数
            safeCall(newMsg.进入时调用的js函数, inst, inst.constructor || null, newMsg, idx);
          }
        },
        进入地点,
        打开商店,
        关闭商店,
        购买物品,
        卖出物品,
        使用物品,
        getItemName(itemInst) {
          return getItemName(itemInst);
        },
        getItemExtra(itemInst) {
          return safeCall(itemInst.显示附加文本所用js函数, itemInst, itemInst.constructor);
        },
        canUseItem(itemInst) {
          const itemCls = itemInst.constructor;
          return typeof itemInst.能否使用 === "function"
            ? safeCall(itemInst.能否使用, itemInst, itemCls) !== false
            : !!itemInst.能否使用;
        },
        getShopName(shopName) {
          const sCls = 商店类列表[shopName];
          return (sCls && sCls.名字) || shopName;
        },
        getItemDisplayName(itemName) {
          const itemCls = 物品类列表[itemName];
          return itemCls ? (itemCls.名字 || itemCls.name || itemName) : itemName;
        },
        getShopItemExtra(entry) {
          if (!状态.打开的商店) return "";
          try {
            const shopCls = getShopCls(状态.打开的商店);
            return safeCall(entry.显示商店对物品附加文本所用js函数, shopCls, entry);
          } catch (e) {
            return "";
          }
        },
        isLocationEnabled(lnk) {
          const to = lnk && lnk.地点;
          const toCls = 地点类列表[to];
          const locCls = this.locCls;
          if (!toCls || !locCls) return true;
          return safeCall(toCls.判断是否禁用而被系统频繁调用的js函数, toCls, 状态.所在地点, locCls) !== false;
        },
        isButtonEnabled(b) {
          const locCls = this.locCls;
          if (!locCls) return false;
          return safeCall(b.判断是否禁用而被系统频繁调用的js函数, locCls, b) !== false;
        },
        handleLocationButton(b) {
          const locCls = this.locCls;
          if (!locCls) return;
          safeCall(b.按下调用的js函数, locCls, b);
        },
        clearMessages() {
          响应式消息队列.splice(0);
          this.$forceUpdate();
        },
        isDialogButtonEnabled(b) {
          if (!响应式当前对话.value) return false;
          const inst = 响应式当前对话.value.inst;
          const msg = this.currentDialogMsg;
          if (!msg) return false;
          return safeCall(b.判断是否禁用而被系统频繁调用的js函数, inst, inst.constructor || null, msg, 响应式当前对话.value.idx, b) !== false;
        },
        handleDialogButton(b) {
          if (!响应式当前对话.value) return;
          const inst = 响应式当前对话.value.inst;
          const msg = this.currentDialogMsg;
          if (!msg) return;
          
          // 进入函数已经在watch中调用，这里只需要处理按钮点击
          safeCall(b.按下调用的js函数, inst, inst.constructor || null, msg, 响应式当前对话.value.idx, b);
          if (!响应式当前对话.value){
            this.$forceUpdate();
            return;
          };
          // 约定：按钮返回值不再影响跳转；只通过 __阻止自动下一条 控制
          if (typeof inst.__阻止自动下一条 !== "boolean") inst.__阻止自动下一条 = false;
          if (!inst.__阻止自动下一条) {
            响应式当前对话.value.idx += 1;
            // idx变化会触发watch中的currentDialogMsg，从而调用新消息的进入函数
          }
          inst.__阻止自动下一条 = false;
          this.$forceUpdate();
        },
        handleDialogQuit() {
          if (!响应式当前对话.value) return;
          const inst = 响应式当前对话.value.inst;
          const msg = this.currentDialogMsg;
          if (!msg) {
            关闭对话();
            return;
          }
          
          const ok = safeCall(msg.用户退出时调用的js函数, inst, inst.constructor || null, msg, 响应式当前对话.value.idx);
          if (ok === false) return;
          关闭对话();
        },
      },
      render(h) {
        const 对话中 = this.对话中;
        const 其他状态栏 = this.其他状态栏;
        
        return h('div', [
          // 顶部状态栏
          h('div', [
            h('span', `钱：${状态.钱} | `),
            h('span', `地点：${状态.所在地点} | `),
            h('span', `商店：${状态.打开的商店 || '无'} | `),
          ]),
          h('br'),
          
          // 其他状态栏（一行三个）
          其他状态栏.length > 0 ? h('div', 其他状态栏.map((item, index) => {
            const elements = [];
            if (item && item.名字) {
              // 强制转换为字符串，避免0值不显示（使用==null检查undefined和null，但保留0）
              const 值文本 = item.值 == null ? '' : String(item.值);
              elements.push(h('span', `${item.名字}：${值文本} | `));
            }
            if ((index + 1) % 3 === 0 && index < 其他状态栏.length - 1) {
              elements.push(h('br'));
            }
            return elements;
          }).flat()) : null,
          h('br'),
          
          // 地点视图
          h('div', [
            h('div', '【地点】'),
            this.locCls ? h('div', this.locCls.显示的文本 || '') : null,
            h('br'),
            
            // 可前往地点
            this.locationLinks.length > 0 ? h('div', [
              h('div', '可前往：'),
              ...this.locationLinks.map(lnk => [
                h('button', {
                  attrs: { disabled: !this.isLocationEnabled(lnk) || 对话中 },
                  on: { click: () => this.进入地点(lnk.地点, true) }
                }, lnk.显示的文本 || ('前往 ' + lnk.地点)),
                h('span', ' '),
              ]).flat(),
              h('br'),
              h('br'),
            ]) : null,
            
            // 地点商店入口
            this.locationShops.length > 0 ? h('div', [
              h('div', '商店：'),
              ...this.locationShops.map(sn => [
                h('button', {
                  attrs: { disabled: 对话中 },
                  on: { click: () => this.打开商店(sn) }
                }, this.getShopName(sn)),
                h('span', ' '),
              ]).flat(),
              h('br'),
              h('br'),
            ]) : null,
            
            // 地点自定义按钮
            this.locationButtons.length > 0 ? h('div', [
              h('div', '行动：'),
              ...this.locationButtons.map(b => [
                h('button', {
                  attrs: { disabled: !this.isButtonEnabled(b) || 对话中 },
                  on: { click: () => this.handleLocationButton(b) }
                }, b.显示文本 || '按钮'),
                h('span', ' '),
              ]).flat(),
            ]) : null,
            
            this.locationError ? h('div', this.locationError) : null,
          ]),
          h('br'),
          h('div', '------------------------------'),
          h('br'),
          
          // 商店面板
          h('div', [
            h('div', '【商店】'),
            状态.打开的商店 ? h('div', [
              h('div', this.shopInfo),
              h('button', {
                attrs: { disabled: 对话中 },
                on: { click: () => this.关闭商店() }
              }, '离开商店'),
              h('br'),
              h('br'),
              
              ...this.shopDataList.map((entry, idx) => h('div', [
                h('span', `${this.getItemDisplayName(entry.物品名)} 价格：${entry.价格} `),
                this.getShopItemExtra(entry) ? h('span', this.getShopItemExtra(entry) + ' ') : null,
                h('button', {
                  attrs: { disabled: 对话中 },
                  on: { click: () => this.购买物品(状态.打开的商店, idx) }
                }, '购买'),
              ])),
              
              this.shopError ? h('div', this.shopError) : null,
            ]) : h('div', '（未打开商店）'),
          ]),
          h('br'),
          h('div', '------------------------------'),
          h('br'),
          
          
          
          // 消息队列
          h('div', [
            h('div', '【消息队列】'),
            响应式消息队列.length === 0 ? h('div', '（空）') : h('div', [
              h('button', { on: { click: () => this.clearMessages() } }, '清空'),
              ...响应式消息队列.slice(-10).map(m => h('div', (m.标题 ? '[' + m.标题 + '] ' : '') + m.消息)),
            ]),
          ]),
          h('br'),
          h('div', '------------------------------'),
          h('br'),
          
          // 对话面板
          h('div', [
            h('div', '【对话】'),
            !响应式当前对话.value ? h('div', '（未在对话中）') : h('div', [
              h('div', this.dialogTitle),
              !this.currentDialogMsg ? h('div', [
                h('div', '（对话结束）'),
                h('button', { on: { click: () => 关闭对话() } }, '关闭'),
              ]) : h('div', [
                h('div', this.dialogContent),
                ...this.dialogButtons.map(b => [
                  h('button', {
                    attrs: { disabled: !this.isDialogButtonEnabled(b) },
                    on: { click: () => this.handleDialogButton(b) }
                  }, b.显示文本 || '按钮'),
                  h('span', ' '),
                ]).flat(),
                h('br'),
                h('button', { on: { click: () => this.handleDialogQuit() } }, '退出对话'),
              ]),
            ]),
          ]),
          h('br'),
          h('div', '------------------------------'),
          h('br'),
          // 背包/物品
          h('div', [
            h('div', '【物品】'),
            状态.物品.length === 0 ? h('div', '（无）') : null,
            ...状态.物品.map(it => h('div', [
              h('span', this.getItemName(it) + ' '),
              this.getItemExtra(it) ? h('span', this.getItemExtra(it) + ' ') : null,
              h('button', {
                attrs: { disabled: !this.canUseItem(it) || 对话中 },
                on: { click: () => this.使用物品(it) }
              }, '使用'),
              h('span', ' '),
              h('button', {
                attrs: { disabled: 对话中 },
                on: { click: () => this.卖出物品(it) }
              }, `卖出(${Number(it.卖掉的价值 ?? 0)})`),
            ])),
          ]),
          
        ]);
      },
    });
  }

  // ---------- 插件加载 ----------
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = false; // 保持顺序
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("加载脚本失败：" + src));
      document.head.appendChild(s);
    });
  }

  async function 加载插件(list) {
    for (const p of list) {
      await loadScript(p);
    }

    // 插件加载后：调用各类的加载钩子
    // 参数约定：对于静态方法，第一个参数就是类本身
    Object.keys(物品类列表).forEach((k) => safeCall(物品类列表[k].加载时执行的js函数, 物品类列表[k]));
    Object.keys(商店类列表).forEach((k) => safeCall(商店类列表[k].加载时执行的js函数, 商店类列表[k]));
    Object.keys(地点类列表).forEach((k) => safeCall(地点类列表[k].加载时执行的js函数, 地点类列表[k]));
  }

  function 启动() {
    // 创建 Vue 应用
    createVueApp();
    
    // 默认入口：起点
    let 真起点 = window.Game && window.Game.起点 ? window.Game.起点 : "起点";
    if (!地点类列表[真起点]) {
      throw new Error('必须存在一个名字为 "起点" 的地点 或者设置 Game.起点');
    }
    状态.所在地点 = 真起点;
    // 首次进入起点：触发进入逻辑
    safeCall(地点类列表[真起点].进入时执行的js函数, 地点类列表[真起点], null, null, false);
    if (vueApp) vueApp.$forceUpdate();
  }

  // 暴露全局
  window.Game = {
    状态,
    提示,
    消息队列添加,
    消息队列,
    显示对话,
    关闭对话,

    注入物品类,
    注入商店类,
    注入地点类,

    进入地点,
    打开商店,
    关闭商店,
    购买物品,
    卖出物品,
    使用物品,

    物品类列表,
    商店类列表,
    地点类列表,

    渲染,

    加载插件,
    启动,
  };
})();
