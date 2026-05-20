// bank.js - 银行系统插件（修复物品数据引用问题）
(function () {
    "use strict";
  
    // 银行地点
    class 银行 {
      static 名字 = "银行";
      static 显示的文本 = "欢迎来到银行。";
  
      static 数据 = {
        指向地点: [{ 地点: "起点", 显示的文本: "返回起点" }],
        商店: ["券店", "A票店", "B票店"],
        按钮: [
          {
            显示文本: "存钱",
            按下调用的js函数: (cls, btn) => {
              Game.显示对话(new 存钱对话());
              return true;
            },
            判断是否禁用而被系统频繁调用的js函数: (cls, btn) => {
              return true;
            }
          },
          {
            显示文本: "取钱",
            按下调用的js函数: (cls, btn) => {
              Game.显示对话(new 取钱对话());
              return true;
            },
            判断是否禁用而被系统频繁调用的js函数: (cls, btn) => {
              return true;
            }
          }
        ]
      };
  
      static 进入时执行的js函数(cls, from地点名, fromCls, 从点击进入) {
        // 初始化银行数据（如果不存在）
        if (!Game.状态.银行数据) {
          初始化银行();
        }
        更新银行显示文本();
        return true;
      }
  
      static 离开时执行的js函数(cls, to地点名, toCls) {
        更新银行显示文本();
        return true;
      }
  
      static 加载时执行的js函数(cls) {
        // 初始化银行数据（如果不存在）
        if (!Game.状态.银行数据) {
          初始化银行();
        }
  
        // 启动银行计时器（每4分钟嘀嗒一次）
        setInterval(() => {
          银行嘀嗒();
        }, 4 * 60 * 1000); // 4分钟 = 240000毫秒
  
        // 启动B票价位更新计时器（每10秒）
        setInterval(() => {
          更新所有B票价位();
        }, 10 * 1000); // 10秒
  
        return true;
      }
  
      static 检查是否允许进入的js函数(cls, from地点名, fromCls, 从点击进入) {
        return true;
      }
  
      static 判断是否禁用而被系统频繁调用的js函数(cls, 当前地点名, 当前地点cls) {
        return true;
      }
    }
  
    // 初始化银行数据
    function 初始化银行() {
      Game.状态.银行数据 = {
        存款: 0, // 银行存款（浮点数，可以取整数部分）
        最后嘀嗒时间: Date.now()
      };
      更新银行状态显示();
    }
  
    // 银行嘀嗒（每4分钟执行一次）
    function 银行嘀嗒() {
      if (!Game.状态.银行数据) {
        初始化银行();
      }
  
      const 银行数据 = Game.状态.银行数据;
      
      // 存款乘以1.03
      银行数据.存款 *= 1.03;
      银行数据.最后嘀嗒时间 = Date.now();
  
      // 更新所有B票的存钱（+0.06倍当前价位）
      更新所有B票存钱();
  
      // 更新显示
      更新银行状态显示();
      Game.渲染();
    }
  
    // 更新所有B票价位（每10秒执行一次）
    function 更新所有B票价位() {
      if (!Game.状态.银行数据) return;
  
      // 递归获取所有B票（包括收纳袋中的）
      const 所有B票 = 递归获取所有B票(Game.状态.物品);
  
      所有B票.forEach(b票 => {
        if (b票.波动率 && b票.当前价位) {
          // 计算两个边界值
          const 最大价值 = Math.floor(b票.当前价位 * b票.波动率);
          const 最小价值 = Math.ceil(b票.当前价位 / b票.波动率);
          
          // 在两个边界之间随机选择一个整数
          b票.当前价位 = Math.floor(Math.random() * (最大价值 - 最小价值 + 1)) + 最小价值;
          
          // 确保不低于1
          if (b票.当前价位 < 1) {
            b票.当前价位 = 1;
          }
          
          // 更新能否使用状态
          b票.能否使用 = (b票.存的钱 || 0) >= 1;
          b票.卖掉的价值 = Math.floor(b票.当前价位)+Math.floor(b票.存的钱);
        }
      });
  
      Game.渲染();
    }
  
    // 更新所有B票存钱（每4分钟执行一次）
    function 更新所有B票存钱() {
      // 递归获取所有B票（包括收纳袋中的）
      const 所有B票 = 递归获取所有B票(Game.状态.物品);
  
      所有B票.forEach(b票 => {
        if (b票.当前价位) {
          // 存的钱 += 0.06 * 当前价位
          b票.存的钱 = (b票.存的钱 || 0) + 0.06 * b票.当前价位;
          // 更新能否使用状态
          b票.能否使用 = (b票.存的钱 || 0) >= 1;
        }
      });
    }
  
    // 递归获取所有B票
    function 递归获取所有B票(物品列表) {
      const 所有B票 = [];
  
      function 遍历物品(items) {
        if (!Array.isArray(items)) return;
  
        items.forEach(item => {
          if (!item) return;
  
          // 如果是B票，添加到列表
          if (item.constructor && item.constructor.名字 === "B票") {
            所有B票.push(item);
          }
  
          // 如果是收纳袋，递归遍历内部物品
          if (item.constructor && item.constructor.名字 === "收纳袋" && item.内部物品 && Array.isArray(item.内部物品)) {
            遍历物品(item.内部物品);
          }
        });
      }
  
      遍历物品(物品列表);
      return 所有B票;
    }
  
    // 更新银行显示文本
    function 更新银行显示文本() {
      const 银行数据 = Game.状态.银行数据;
      if (!银行数据) return;
  
      const 存款整数 = Math.floor(银行数据.存款);
      const 存款小数 = (银行数据.存款 - 存款整数).toFixed(2);
      银行.显示的文本 = `欢迎来到银行。\n当前存款：${存款整数}（小数部分：${存款小数}）`;
    }
  
    // 更新银行状态显示
    function 更新银行状态显示() {
      const 银行数据 = Game.状态.银行数据;
      if (!银行数据) return;
  
      const 存款整数 = Math.floor(银行数据.存款);
      
      // 更新其他状态栏
      const 显示状态 = Game.状态.其他状态栏 || [];
      const 银行状态索引 = 显示状态.findIndex(s => s.名字 === "银行存款");
      
      if (银行状态索引 >= 0) {
        显示状态[银行状态索引].值 = 存款整数;
      } else {
        显示状态.push({ 名字: "银行存款", 值: 存款整数 });
      }
    }
  
    // 存钱对话
    class 存钱对话 {
      constructor() {
        this.标题 = "存钱";
        this.消息 = [];
        this.更新消息();
      }
  
      更新消息() {
        const 面额选项 = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
        const 当前钱 = Game.状态.钱;

        this.消息 = [{
          内容: `选择要存入的金额（当前拥有：${当前钱}元）：`,
          进入时调用的js函数: (thisArg, cls, msg, idx) => {
            thisArg.__阻止自动下一条 = true;
          },
          按钮: []
        }];

        面额选项.forEach(面额 => {
          if (当前钱 >= 面额) {
            this.消息[0].按钮.push({
              显示文本: `${面额}元`,
              按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                if (Game.状态.钱 >= 面额) {
                  Game.状态.钱 -= 面额;
                  Game.状态.银行数据.存款 += 面额;
                  更新银行状态显示();
                  更新银行显示文本();
                  Game.消息队列添加(`成功存入${面额}元！`, "存钱成功");
                  // 不关闭对话，重新更新消息以便继续操作
                  thisArg.__阻止自动下一条 = true;
                  thisArg.更新消息();
                  Game.渲染();
                } else {
                  Game.消息队列添加("钱不够！", "存钱失败");
                }
                return true;
              }
            });
          }
        });

        this.消息[0].按钮.push({
          显示文本: "取消",
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            Game.关闭对话();
            return true;
          }
        });
      }
    }
  
    // 取钱对话
    class 取钱对话 {
      constructor() {
        this.标题 = "取钱";
        this.消息 = [];
        this.更新消息();
      }
  
      更新消息() {
        const 银行数据 = Game.状态.银行数据;
        if (!银行数据) {
          this.消息 = [{
            内容: "银行系统未初始化。",
            进入时调用的js函数: (thisArg, cls, msg, idx) => {
              thisArg.__阻止自动下一条 = true;
            },
            按钮: [{
              显示文本: "返回",
              按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                Game.关闭对话();
                return true;
              }
            }]
          }];
          return;
        }

        const 存款整数 = Math.floor(银行数据.存款);
        const 面额选项 = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];

        this.消息 = [{
          内容: `选择要取出的金额（可取出：${存款整数}元）：`,
          进入时调用的js函数: (thisArg, cls, msg, idx) => {
            thisArg.__阻止自动下一条 = true;
          },
          按钮: []
        }];

        面额选项.forEach(面额 => {
          if (存款整数 >= 面额) {
            this.消息[0].按钮.push({
              显示文本: `${面额}元`,
              按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                const 当前存款整数 = Math.floor(Game.状态.银行数据.存款);
                if (当前存款整数 >= 面额) {
                  Game.状态.银行数据.存款 -= 面额;
                  Game.状态.钱 += 面额;
                  更新银行状态显示();
                  更新银行显示文本();
                  Game.消息队列添加(`成功取出${面额}元！`, "取钱成功");
                  // 不关闭对话，重新更新消息以便继续操作
                  thisArg.__阻止自动下一条 = true;
                  thisArg.更新消息();
                  Game.渲染();
                } else {
                  Game.消息队列添加("可取出金额不足！", "取钱失败");
                }
                return true;
              }
            });
          }
        });

        this.消息[0].按钮.push({
          显示文本: "取消",
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            Game.关闭对话();
            return true;
          }
        });
      }
    }
  
    // 设置面额对话（用于A票店和B票店）
    class 设置面额对话 {
      constructor(商店类) {
        this.标题 = "设置票店面额";
        this.商店类 = 商店类;
        this.消息 = [];
        this.更新消息();
      }
  
      更新消息() {
        const 面额选项 = [200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  
        this.消息 = [{
          内容: "选择要设置的面额（最少200元）：",
          按钮: []
        }];
  
        面额选项.forEach(面额 => {
          this.消息[0].按钮.push({
            显示文本: `${面额}元`,
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              // 更新商店内所有商品的面额
              if (thisArg.商店类 && thisArg.商店类.数据) {
                thisArg.商店类.数据.forEach(商品 => {
                  if (商品.物品名 === "A票" || 商品.物品名 === "B票") {
                    // 使用新对象避免引用问题
                    商品.价格 = 面额;
                    // 注意：这里只更新商店显示，实际创建物品时需要新的物品数据
                    商品.物品数据 = 获取物品数据副本(商品, 面额);
                  }
                });
                Game.消息队列添加(`已将${thisArg.商店类.名字}的面额设置为${面额}元。`, "设置成功");
                Game.关闭对话();
                Game.渲染();
              }
              return true;
            }
          });
        });
  
        this.消息[0].按钮.push({
          显示文本: "取消",
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            Game.关闭对话();
            return true;
          }
        });
      }
    }
  
    // 辅助函数：获取物品数据的深拷贝
    function 获取物品数据副本(商品, 面额) {
      if (!商品.物品数据) {
        return { 面额: 面额 };
      }
      
      // 创建新对象，避免引用问题
      const 新数据 = { ...商品.物品数据, 面额: 面额 };
      
      // 对于B票，还需要更新初始价位
      if (商品.物品名 === "B票") {
        新数据.初始价位 = 面额;
      }
      
      return 新数据;
    }
  
    // 物品类：券
    class 券 {
      static 名字 = "券";
  
      constructor(data) {
        this.描述 = "银行发行的券，可以兑换成现金。";
        this.卖掉的价值 = data?.面额 || 1;
        this.面额 = data?.面额 || 1;
        this.能否使用 = false;
      }
  
      显示附加文本所用js函数(thisArg, cls) {
        return `（面额：${thisArg.面额}）`;
      }
  
      卖掉时执行的js函数(thisArg, cls) {
        // 卖掉券可以获得面额的钱
        Game.消息队列添加(`兑换了面额${thisArg.面额}的券，获得${thisArg.面额}元。`, "兑换成功");
        return true;
      }
    }
  
    // 物品类：A票
    class A票 {
      static 名字 = "A票";
  
      constructor(data) {
        // 确保每个A票实例都有独立的数据
        const 默认数据 = { 面额: 200, 波动率: 0.1 };
        const 物品数据 = { ...默认数据, ...data };
        
        this.描述 = "银行发行的A票，使用后可以获得随机金额。";
        this.卖掉的价值 = 物品数据.面额;
        this.面额 = 物品数据.面额;
        this.波动率 = 物品数据.波动率;
        this.能否使用 = true;
      }
  
      使用后执行的js函数(thisArg, cls) {
        // 随机金额 = 面额 +- (面额 * 波动率) 范围内的随机整数
        const 波动范围 = Math.floor(thisArg.面额 * thisArg.波动率);
        const 最小金额 = thisArg.面额 - 波动范围;
        const 最大金额 = thisArg.面额 + 波动范围;
        const 随机金额 = Math.floor(Math.random() * (最大金额 - 最小金额 + 1)) + 最小金额;
  
        Game.状态.钱 += 随机金额;
        Game.消息队列添加(`使用A票获得${随机金额}元（面额：${thisArg.面额}，波动：±${波动范围}）。`, "使用A票");
  
        // 消耗A票
        const idx = Game.状态.物品.indexOf(thisArg);
        if (idx >= 0) Game.状态.物品.splice(idx, 1);
  
        return true;
      }
  
      显示附加文本所用js函数(thisArg, cls) {
        return `（面额：${thisArg.面额}，波动率：${(thisArg.波动率 * 100).toFixed(1)}%）`;
      }
  
      卖掉时执行的js函数(thisArg, cls) {
        // 卖掉可以换回完整面额
        Game.消息队列添加(`卖掉了面额${thisArg.面额}的A票，获得${thisArg.面额}元。`, "卖出A票");
        return true;
      }
    }
  
    // 物品类：B票
    class B票 {
      static 名字 = "B票";
  
      constructor(data) {
        // 确保每个B票实例都有独立的数据
        const 默认数据 = { 面额: 200, 初始价位: 200, 波动率: 1.1 };
        const 物品数据 = { ...默认数据, ...data };
        
        this.描述 = "银行发行的B票，会随时间变化价位并自动存钱。";
        this.面额 = 物品数据.面额;
        this.初始价位 = 物品数据.初始价位;
        this.卖掉的价值 = 物品数据.初始价位;
        this.当前价位 = 物品数据.初始价位;
        this.波动率 = 物品数据.波动率;
        this.存的钱 = 0; // 存的钱（浮点数）
        this.能否使用 = false; // 只有当存的钱>=1时才可以使用
      }
  
      能否使用(thisArg, cls) {
        // 只有当存的钱>=1时才可以使用
        return (thisArg.存的钱 || 0) >= 1;
      }
  
      使用后执行的js函数(thisArg, cls) {
        // 取出存的钱的整数部分
        const 可取金额 = Math.floor(thisArg.存的钱 || 0);
        if (可取金额 > 0) {
          Game.状态.钱 += 可取金额;
          thisArg.存的钱 -= 可取金额;
          Game.消息队列添加(`从B票中取出${可取金额}元（剩余：${(thisArg.存的钱 || 0).toFixed(2)}元）。`, "取出B票存款");
          thisArg.能否使用 = (thisArg.存的钱 || 0) >= 1;
          Game.渲染();
        } else {
          Game.消息队列添加("B票中还没有足够的钱可以取出。", "取出失败");
        }
        return true;
      }
  
      显示附加文本所用js函数(thisArg, cls) {
        const 存的钱整数 = Math.floor(thisArg.存的钱 || 0);
        const 存的钱小数 = ((thisArg.存的钱 || 0) - 存的钱整数).toFixed(2);
        return `（面额：${thisArg.面额}，当前价位：${thisArg.当前价位}，波动率：${((thisArg.波动率 - 1) * 100).toFixed(1)}%，存的钱：${存的钱整数}（小数：${存的钱小数}））`;
      }
      
      卖掉时执行的js函数(thisArg, cls) {
        // 卖掉会给你floor的当前价位
        const 卖出价格 = thisArg.卖掉的价值;
        Game.消息队列添加(`卖掉了B票，获得${卖出价格}元（当前价位：${thisArg.当前价位}）。`, "卖出B票");
        return true;
      }
      // 定期更新能否使用状态
      更新能否使用状态(thisArg) {
        thisArg.能否使用 = (thisArg.存的钱 || 0) >= 1;
      }
    }
  
    // 商店类：券店
    class 券店 {
      static 名字 = "券店";
      static 显示的文本 = "这里出售各种面额的券。";
  
      // 使用函数返回数据，避免引用问题
      static 获取数据() {
        return [
          {
            物品名: "券",
            价格: 1,
            物品数据: { 面额: 1 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}）`;
            }
          },
          {
            物品名: "券",
            价格: 10,
            物品数据: { 面额: 10 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}）`;
            }
          },
          {
            物品名: "券",
            价格: 100,
            物品数据: { 面额: 100 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}）`;
            }
          },
          {
            物品名: "券",
            价格: 1000,
            物品数据: { 面额: 1000 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}）`;
            }
          },
          {
            物品名: "券",
            价格: 10000,
            物品数据: { 面额: 10000 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}）`;
            }
          },
          {
            物品名: "券",
            价格: 100000,
            物品数据: { 面额: 100000 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}）`;
            }
          },
          {
            物品名: "券",
            价格: 1000000,
            物品数据: { 面额: 1000000 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}）`;
            }
          }
        ];
      }
  
      static 进入时执行的js函数(cls) {
        return true;
      }
  
      static 离开时执行的js函数(cls, nextShopCls) {
        return true;
      }
  
      static 加载时执行的js函数(cls) {
        return true;
      }
    }
  
    // 商店类：A票店
    class A票店 {
      static 名字 = "A票店";
      static 显示的文本 = "这里出售各种A票。";
  
      // 使用函数返回数据，避免引用问题
      static 获取数据() {
        return [
          {
            物品名: "A票",
            价格: 200,
            物品数据: { 面额: 200, 波动率: 0.1 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}，波动率：${(条目.物品数据.波动率 * 100).toFixed(1)}%）`;
            }
          },
          {
            物品名: "A票",
            价格: 200,
            物品数据: { 面额: 200, 波动率: 0.2 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}，波动率：${(条目.物品数据.波动率 * 100).toFixed(1)}%）`;
            }
          },
          {
            物品名: "A票",
            价格: 200,
            物品数据: { 面额: 200, 波动率: 0.3 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}，波动率：${(条目.物品数据.波动率 * 100).toFixed(1)}%）`;
            }
          }
        ];
      }
  
      static 进入时执行的js函数(cls) {
        return true;
      }
  
      static 离开时执行的js函数(cls, nextShopCls) {
        return true;
      }
  
      static 加载时执行的js函数(cls) {
        return true;
      }
    }
  
    // 商店类：B票店
    class B票店 {
      static 名字 = "B票店";
      static 显示的文本 = "这里出售各种B票。";
  
      // 使用函数返回数据，避免引用问题
      static 获取数据() {
        return [
          {
            物品名: "B票",
            价格: 200,
            物品数据: { 面额: 200, 初始价位: 200, 波动率: 1.1 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}，初始价位：${条目.物品数据.初始价位}，波动率：${((条目.物品数据.波动率 - 1) * 100).toFixed(1)}%）`;
            }
          },
          {
            物品名: "B票",
            价格: 200,
            物品数据: { 面额: 200, 初始价位: 200, 波动率: 1.2 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}，初始价位：${条目.物品数据.初始价位}，波动率：${((条目.物品数据.波动率 - 1) * 100).toFixed(1)}%）`;
            }
          },
          {
            物品名: "B票",
            价格: 200,
            物品数据: { 面额: 200, 初始价位: 200, 波动率: 1.3 },
            显示商店对物品附加文本所用js函数: (cls, 条目) => {
              return `（面额：${条目.物品数据.面额}，初始价位：${条目.物品数据.初始价位}，波动率：${((条目.物品数据.波动率 - 1) * 100).toFixed(1)}%）`;
            }
          }
        ];
      }
  
      static 进入时执行的js函数(cls) {
        return true;
      }
  
      static 离开时执行的js函数(cls, nextShopCls) {
        return true;
      }
  
      static 加载时执行的js函数(cls) {
        return true;
      }
    }
  
    // 为A票店和B票店添加"设置票店面额"按钮
    // 需要在银行地点添加按钮，或者直接在商店中添加
    // 根据需求，应该在银行地点添加按钮
  
    银行.数据.按钮.push({
      显示文本: "设置A票店面额",
      按下调用的js函数: (cls, btn) => {
        const A票店类 = Game.商店类列表["A票店"];
        if (A票店类) {
          Game.显示对话(new 设置面额对话(A票店类));
        }
        return true;
      },
      判断是否禁用而被系统频繁调用的js函数: (cls, btn) => {
        return true;
      }
    });
  
    银行.数据.按钮.push({
      显示文本: "设置B票店面额",
      按下调用的js函数: (cls, btn) => {
        const B票店类 = Game.商店类列表["B票店"];
        if (B票店类) {
          Game.显示对话(new 设置面额对话(B票店类));
        }
        return true;
      },
      判断是否禁用而被系统频繁调用的js函数: (cls, btn) => {
        return true;
      }
    });
  
    // 定期更新B票的能否使用状态
    setInterval(() => {
      const 所有B票 = 递归获取所有B票(Game.状态.物品);
      所有B票.forEach(b票 => {
        b票.更新能否使用状态(b票);
      });
      Game.渲染();
    }, 1000); // 每秒检查一次
  
    // 注册所有类
    Game.注入物品类(券);
    Game.注入物品类(A票);
    Game.注入物品类(B票);
  
    // 修改商店注册，使用函数返回数据
    const 券店类 = 券店;
    const A票店类 = A票店;
    const B票店类 = B票店;
    
    // 添加数据属性以便访问
    券店类.数据 = 券店类.获取数据();
    A票店类.数据 = A票店类.获取数据();
    B票店类.数据 = B票店类.获取数据();
  
    Game.注入商店类(券店类);
    Game.注入商店类(A票店类);
    Game.注入商店类(B票店类);
    Game.注入地点类(银行);
  
    // 添加银行到起点
    const 起点类 = Game.地点类列表["起点"];
    if (起点类 && 起点类.数据 && 起点类.数据.指向地点) {
      起点类.数据.指向地点.push({ 地点: "银行", 显示的文本: "前往银行" });
    }
  
    Game.消息队列添加("银行系统插件加载完成！现在可以从起点前往银行了。", "插件加载");
  })();