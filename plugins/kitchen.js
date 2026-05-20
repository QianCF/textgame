// kitchen.js - 厨房扩展插件
(function () {
  "use strict";

  // ==================== 厨房地点 ====================
  class 厨房 {
    static 名字 = "厨房";
    static 显示的文本 = "";

    static 数据 = {
      指向地点: [
        { 地点: "农场", 显示的文本: "返回农场" },
      ],
      商店: ["厨房商店"],
      按钮: [
        {
          显示文本: "升级小麦等级",
          按下调用的js函数: (cls, btn) => {
            升级等级('小麦');
            return true;
          },
          判断是否禁用而被系统频繁调用的js函数: (cls, btn) => {
            const 当前等级 = 获取等级('小麦');
            const 费用 = Math.floor(Math.pow(1.2, 当前等级));
            btn.显示文本 = `升级小麦等级（费用：${费用}元）`;
            return true;
          }
        },
        {
          显示文本: "升级土豆等级",
          按下调用的js函数: (cls, btn) => {
            升级等级('土豆');
            return true;
          },
          判断是否禁用而被系统频繁调用的js函数: (cls, btn) => {
            const 当前等级 = 获取等级('土豆');
            const 费用 = Math.floor(Math.pow(1.2, 当前等级));
            btn.显示文本 = `升级土豆等级（费用：${费用}元）`;
            return true;
          }
        },
        {
          显示文本: "升级胡萝卜等级",
          按下调用的js函数: (cls, btn) => {
            升级等级('胡萝卜');
            return true;
          },
          判断是否禁用而被系统频繁调用的js函数: (cls, btn) => {
            const 当前等级 = 获取等级('胡萝卜');
            const 费用 = Math.floor(Math.pow(1.2, 当前等级));
            btn.显示文本 = `升级胡萝卜等级（费用：${费用}元）`;
            return true;
          }
        },
        {
          显示文本: "升级客人等级",
          按下调用的js函数: (cls, btn) => {
            升级等级('客人');
            return true;
          },
          判断是否禁用而被系统频繁调用的js函数: (cls, btn) => {
            const 当前等级 = 获取等级('客人');
            const 费用 = Math.floor(Math.pow(1.2, 当前等级));
            btn.显示文本 = `升级客人等级（费用：${费用}元）`;
            return true;
          }
        }
      ]
    };

    static 进入时执行的js函数(cls, from地点名, fromCls, 从点击进入) {
      更新厨房显示文本();
      return true;
    }

    static 离开时执行的js函数(cls, to地点名, toCls) {
      return true;
    }

    static 加载时执行的js函数(cls) {
      // 初始化厨房数据（如果不存在）
      if (!Game.状态.厨房数据) {
        初始化厨房();
      }
      更新厨房显示文本();
      return true;
    }

    static 检查是否允许进入的js函数(cls, from地点名, fromCls, 从点击进入) {
      return true;
    }

    static 判断是否禁用而被系统频繁调用的js函数(cls, 当前地点名, 当前地点cls) {
      return true;
    }
  }

  // ==================== 初始化厨房数据 ====================
  function 初始化厨房() {
    Game.状态.厨房数据 = {
      小麦等级: 1,
      土豆等级: 1,
      胡萝卜等级: 1,
      客人等级: 1
    };
  }

  // ==================== 获取等级 ====================
  function 获取等级(类型) {
    if (!Game.状态.厨房数据) {
      初始化厨房();
    }
    const 数据 = Game.状态.厨房数据;
    switch(类型) {
      case '小麦': return 数据.小麦等级 || 1;
      case '土豆': return 数据.土豆等级 || 1;
      case '胡萝卜': return 数据.胡萝卜等级 || 1;
      case '客人': return 数据.客人等级 || 1;
      default: return 1;
    }
  }

  // ==================== 升级等级 ====================
  function 升级等级(类型) {
    if (!Game.状态.厨房数据) {
      初始化厨房();
    }
    const 数据 = Game.状态.厨房数据;
    const 当前等级 = 获取等级(类型);
    const 费用 = Math.floor(Math.pow(1.2, 当前等级));
    
    if (Game.状态.钱 < 费用) {
      Game.消息队列添加(`钱不够！需要${费用}元。`, "升级失败");
      return false;
    }
    
    Game.状态.钱 -= 费用;
    
    switch(类型) {
      case '小麦':
      数据.小麦等级 = (数据.小麦等级 || 1) + 1;
      Game.消息队列添加(`小麦等级已升级到${数据.小麦等级}！`, "升级成功");
      break;
      case '土豆':
      数据.土豆等级 = (数据.土豆等级 || 1) + 1;
      Game.消息队列添加(`土豆等级已升级到${数据.土豆等级}！`, "升级成功");
      break;
      case '胡萝卜':
      数据.胡萝卜等级 = (数据.胡萝卜等级 || 1) + 1;
      Game.消息队列添加(`胡萝卜等级已升级到${数据.胡萝卜等级}！`, "升级成功");
      break;
      case '客人':
      数据.客人等级 = (数据.客人等级 || 1) + 1;
      Game.消息队列添加(`客人等级已升级到${数据.客人等级}！`, "升级成功");
      break;
    }
    
    更新厨房显示文本();
    Game.渲染();
    return true;
  }

  // ==================== 更新厨房显示文本 ====================
  function 更新厨房显示文本() {
    if (!Game.状态.厨房数据) {
      初始化厨房();
    }
    const 数据 = Game.状态.厨房数据;
    厨房.显示的文本 = `你的厨房\n小麦等级：${数据.小麦等级}\n土豆等级：${数据.土豆等级}\n胡萝卜等级：${数据.胡萝卜等级}\n客人等级：${数据.客人等级}`;
  }

  // ==================== 厨房商店 ====================
  class 厨房商店 {
    static 名字 = "厨房商店";
    static 显示的文本 = "这里可以购买锅和客人。";

    static 数据 = [
      {
        物品名: "锅",
        价格: 100,
        物品数据: {
          耐久度: 10
        },
        显示商店对物品附加文本所用js函数: (cls, 条目) => {
          return "（可以制作菜）";
        }
      },
      {
        物品名: "客人",
        价格: 5,
        物品数据: {},
        显示商店对物品附加文本所用js函数: (cls, 条目) => {
          return "（可以购买菜）";
        }
      }
    ];

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

  // ==================== 物品类：锅 ====================
  class 锅 {
    static 名字 = "锅";

    constructor(data) {
      this.描述 = "一口锅，可以用来制作菜。";
      this.耐久度 = data?.耐久度 || 10;
      // 总是根据当前耐久度计算，确保存档加载后状态正确
      this.能否使用 = this.耐久度 > 0;
      this.卖掉的价值 = Math.floor(this.耐久度 / 10 * 100);
    }

    使用后执行的js函数(thisArg, cls) {
      if (thisArg.耐久度 <= 0) {
        Game.消息队列添加("锅已经用完了！", "使用失败");
        return false;
      }
      // 显示做菜对话
      Game.显示对话(new 做菜对话(thisArg));
      return false; // 不自动消耗
    }

    显示附加文本所用js函数(thisArg, cls) {
      return `（耐久度：${thisArg.耐久度}/10）`;
    }

    卖掉时执行的js函数(thisArg, cls) {
      thisArg.卖掉的价值 = Math.floor(thisArg.耐久度 / 10 * 100);
      Game.消息队列添加(`卖掉了锅，获得${thisArg.卖掉的价值}元。`, "卖出成功");
      return true;
    }
  }

  // ==================== 做菜对话 ====================
  class 做菜对话 {
    constructor(锅实例) {
      this.标题 = "制作菜";
      this.锅实例 = 锅实例;
      this.消息 = [];
      this.选择的小麦 = ""; // 改为字符串
      this.选择的土豆 = ""; // 改为字符串
      this.选择的胡萝卜 = ""; // 改为字符串
      this.更新消息();
    }

    更新消息() {
      // 获取背包第一层物品（不递归）
      const 背包物品 = Game.状态.物品;
      const 小麦列表 = 背包物品.filter(item => 
        item && item.constructor && item.constructor.名字 === "小麦"
      );
      const 土豆列表 = 背包物品.filter(item => 
        item && item.constructor && item.constructor.名字 === "土豆"
      );
      const 胡萝卜列表 = 背包物品.filter(item => 
        item && item.constructor && item.constructor.名字 === "胡萝卜"
      );

      const 小麦数量 = 小麦列表.length;
      const 土豆数量 = 土豆列表.length;
      const 胡萝卜数量 = 胡萝卜列表.length;

      // 转换为整数进行计算
      const 小麦整数 = parseInt(this.选择的小麦) || 0;
      const 土豆整数 = parseInt(this.选择的土豆) || 0;
      const 胡萝卜整数 = parseInt(this.选择的胡萝卜) || 0;

      // 计算当前价值
      const 小麦等级 = 获取等级('小麦');
      const 土豆等级 = 获取等级('土豆');
      const 胡萝卜等级 = 获取等级('胡萝卜');
      const 当前价值 = 小麦整数 * 小麦等级 + 
                       土豆整数 * 土豆等级 + 
                       胡萝卜整数 * 胡萝卜等级;
      const 当前卖价 = 小麦整数 * 2 + 
                       土豆整数 * 3 + 
                       胡萝卜整数 * 4;

      this.消息 = [{
        内容: `选择食材制作菜（当前选择：小麦${小麦整数}个，土豆${土豆整数}个，胡萝卜${胡萝卜整数}个）\n当前价值：${当前价值}，卖出价格：${当前卖价}元`,
        进入时调用的js函数: (thisArg, cls, msg, idx) => {
          thisArg.__阻止自动下一条 = true;
        },
        按钮: []
      }];

      // 添加做菜按钮（始终可见）
      this.消息[0].按钮.push({
        显示文本: "做菜",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          thisArg.__阻止自动下一条 = true; // 确保失败时界面不消失
          
          const 小麦整数 = parseInt(thisArg.选择的小麦) || 0;
          const 土豆整数 = parseInt(thisArg.选择的土豆) || 0;
          const 胡萝卜整数 = parseInt(thisArg.选择的胡萝卜) || 0;

          if (小麦整数 === 0 && 土豆整数 === 0 && 胡萝卜整数 === 0) {
            Game.消息队列添加("请至少选择一种食材！", "做菜失败");
            return true;
          }

          // 检查是否有足够的食材
          const 当前小麦数量 = Game.状态.物品.filter(item => 
            item && item.constructor && item.constructor.名字 === "小麦"
          ).length;
          const 当前土豆数量 = Game.状态.物品.filter(item => 
            item && item.constructor && item.constructor.名字 === "土豆"
          ).length;
          const 当前胡萝卜数量 = Game.状态.物品.filter(item => 
            item && item.constructor && item.constructor.名字 === "胡萝卜"
          ).length;

          if (小麦整数 > 当前小麦数量) {
            Game.消息队列添加(`小麦数量不足！需要${小麦整数}个，只有${当前小麦数量}个。`, "做菜失败");
            return true;
          }
          if (土豆整数 > 当前土豆数量) {
            Game.消息队列添加(`土豆数量不足！需要${土豆整数}个，只有${当前土豆数量}个。`, "做菜失败");
            return true;
          }
          if (胡萝卜整数 > 当前胡萝卜数量) {
            Game.消息队列添加(`胡萝卜数量不足！需要${胡萝卜整数}个，只有${当前胡萝卜数量}个。`, "做菜失败");
            return true;
          }

          // 消耗食材
          let 消耗的小麦 = 0;
          let 消耗的土豆 = 0;
          let 消耗的胡萝卜 = 0;

          // 消耗小麦
          for (let i = 0; i < 小麦整数; i++) {
            const 小麦索引 = Game.状态.物品.findIndex(item => 
              item && item.constructor && item.constructor.名字 === "小麦"
            );
            if (小麦索引 >= 0) {
              Game.状态.物品.splice(小麦索引, 1);
              消耗的小麦++;
            }
          }

          // 消耗土豆
          for (let i = 0; i < 土豆整数; i++) {
            const 土豆索引 = Game.状态.物品.findIndex(item => 
              item && item.constructor && item.constructor.名字 === "土豆"
            );
            if (土豆索引 >= 0) {
              Game.状态.物品.splice(土豆索引, 1);
              消耗的土豆++;
            }
          }

          // 消耗胡萝卜
          for (let i = 0; i < 胡萝卜整数; i++) {
            const 胡萝卜索引 = Game.状态.物品.findIndex(item => 
              item && item.constructor && item.constructor.名字 === "胡萝卜"
            );
            if (胡萝卜索引 >= 0) {
              Game.状态.物品.splice(胡萝卜索引, 1);
              消耗的胡萝卜++;
            }
          }

          // 创建菜物品
          const 小麦等级 = 获取等级('小麦');
          const 土豆等级 = 获取等级('土豆');
          const 胡萝卜等级 = 获取等级('胡萝卜');
          const 菜价值 = 消耗的小麦 * 小麦等级 + 
                         消耗的土豆 * 土豆等级 + 
                         消耗的胡萝卜 * 胡萝卜等级;
          const 菜卖价 = 消耗的小麦 * 2 + 
                         消耗的土豆 * 3 + 
                         消耗的胡萝卜 * 4;

          const 菜实例 = new 菜({
            价值: 菜价值,
            卖掉的价值: 菜卖价
          });
          Game.状态.物品.push(菜实例);

          // 减少锅的耐久度
          thisArg.锅实例.耐久度--;
          thisArg.锅实例.能否使用 = thisArg.锅实例.耐久度 > 0;
          thisArg.锅实例.卖掉的价值 = Math.floor(thisArg.锅实例.耐久度 / 10 * 100);

          Game.消息队列添加(`成功制作了菜（价值：${菜价值}，卖出价格：${菜卖价}元）！`, "做菜成功");

          // 如果锅用完了，移除它
          if (thisArg.锅实例.耐久度 <= 0) {
            const 锅索引 = Game.状态.物品.indexOf(thisArg.锅实例);
            if (锅索引 >= 0) {
              Game.状态.物品.splice(锅索引, 1);
              Game.消息队列添加("锅已经用完了，自动移除。", "锅用完");
            }
          }

          Game.关闭对话();
          Game.渲染();
          return true;
        }
      });

      // 添加小麦数字输入按钮
      if (小麦数量 > 0) {
        this.消息[0].按钮.push({
          显示文本: "小麦：",
          按下调用的js函数: () => { return true; }, // 占位，不执行任何操作
          判断是否禁用而被系统频繁调用的js函数: () => false // 禁用，仅作为标签
        });
        
        // 添加0-9数字按钮
        for (let i = 0; i <= 9; i++) {
          this.消息[0].按钮.push({
            显示文本: `${i}`,
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.__阻止自动下一条 = true; // 防止界面退出
              thisArg.选择的小麦 = (thisArg.选择的小麦 || "") + i;
              thisArg.更新消息();
              Game.渲染();
              return true;
            }
          });
        }
        
        // 添加清除按钮
        this.消息[0].按钮.push({
          显示文本: "清除",
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            thisArg.__阻止自动下一条 = true; // 防止界面退出
            thisArg.选择的小麦 = "";
            thisArg.更新消息();
            Game.渲染();
            return true;
          }
        });
      }

      // 添加土豆数字输入按钮
      if (土豆数量 > 0) {
        this.消息[0].按钮.push({
          显示文本: "土豆：",
          按下调用的js函数: () => { return true; },
          判断是否禁用而被系统频繁调用的js函数: () => false // 禁用，仅作为标签
        });
        
        // 添加0-9数字按钮
        for (let i = 0; i <= 9; i++) {
          this.消息[0].按钮.push({
            显示文本: `${i}`,
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.__阻止自动下一条 = true; // 防止界面退出
              thisArg.选择的土豆 = (thisArg.选择的土豆 || "") + i;
              thisArg.更新消息();
              Game.渲染();
              return true;
            }
          });
        }
        
        // 添加清除按钮
        this.消息[0].按钮.push({
          显示文本: "清除",
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            thisArg.__阻止自动下一条 = true; // 防止界面退出
            thisArg.选择的土豆 = "";
            thisArg.更新消息();
            Game.渲染();
            return true;
          }
        });
      }

      // 添加胡萝卜数字输入按钮
      if (胡萝卜数量 > 0) {
        this.消息[0].按钮.push({
          显示文本: "胡萝卜：",
          按下调用的js函数: () => { return true; },
          判断是否禁用而被系统频繁调用的js函数: () => false // 禁用，仅作为标签
        });
        
        // 添加0-9数字按钮
        for (let i = 0; i <= 9; i++) {
          this.消息[0].按钮.push({
            显示文本: `${i}`,
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.__阻止自动下一条 = true; // 防止界面退出
              thisArg.选择的胡萝卜 = (thisArg.选择的胡萝卜 || "") + i;
              thisArg.更新消息();
              Game.渲染();
              return true;
            }
          });
        }
        
        // 添加清除按钮
        this.消息[0].按钮.push({
          显示文本: "清除",
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            thisArg.__阻止自动下一条 = true; // 防止界面退出
            thisArg.选择的胡萝卜 = "";
            thisArg.更新消息();
            Game.渲染();
            return true;
          }
        });
      }

      // 添加返回按钮
      this.消息[0].按钮.push({
        显示文本: "返回",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          Game.关闭对话();
          return true;
        }
      });
    }
  }

  // ==================== 物品类：菜 ====================
  class 菜 {
    static 名字 = "菜";

    constructor(data) {
      this.描述 = "一道美味的菜。";
      this.价值 = data?.价值 || 0;
      this.卖掉的价值 = data?.卖掉的价值 || 0;
      this.能否使用 = true;
    }

    使用后执行的js函数(thisArg, cls) {
      const 物品列表 = Game.状态.物品;
      const 菜索引 = 物品列表.indexOf(thisArg);
      
      if (菜索引 < 0) {
        Game.消息队列添加("菜已不存在！", "错误");
        return false;
      }

      // 如果已经在第一格，不动并发出提示
      if (菜索引 === 0) {
        Game.消息队列添加("菜已经在第一格了。", "提示");
        return true;
      }

      // 向前移动一格（与上一个物品交换位置）
      const 上一个物品 = 物品列表[菜索引 - 1];
      if (上一个物品) {
        物品列表[菜索引] = 上一个物品;
        物品列表[菜索引 - 1] = thisArg;
        Game.消息队列添加("菜向前移动了一格。", "移动成功");
        Game.渲染();
        return true;
      }

      return true;
    }

    显示附加文本所用js函数(thisArg, cls) {
      return `（价值：${thisArg.价值}）`;
    }

    卖掉时执行的js函数(thisArg, cls) {
      Game.消息队列添加(`卖出了菜，获得${thisArg.卖掉的价值}元。`, "卖出成功");
      return true;
    }
  }

  // ==================== 物品类：客人 ====================
  class 客人 {
    static 名字 = "客人";

    constructor(data) {
      this.描述 = "一位客人，可以购买你的菜。";
      this.能否使用 = true;
      
      // 如果是从存档加载，优先使用存档数据
      if (data && data.是富客 !== undefined) {
        this.是富客 = data.是富客;
        // 处理Infinity的序列化问题（JSON会把Infinity转成null）
        if (data.最大支付能力 !== undefined) {
          this.最大支付能力 = (data.最大支付能力 === null && this.是富客) ? Infinity : data.最大支付能力;
        } else {
          this.最大支付能力 = this.是富客 ? Infinity : 10 * 获取等级('客人');
        }
        this.卖掉的价值 = data.卖掉的价值 !== undefined ? data.卖掉的价值 : (this.是富客 ? 100 : 0);
      } else {
        // 新创建的客人，随机生成
        const 客人等级 = 获取等级('客人');
        this.最大支付能力 = 10 * 客人等级;
        
        // 3%的概率是富客
        const 是富客 = Math.random() < 0.03;
        if (是富客) {
          this.是富客 = true;
          this.卖掉的价值 = 100;
          this.最大支付能力 = Infinity; // 富客可以负担任何菜
        } else {
          this.是富客 = false;
          this.卖掉的价值 = 0;
        }
      }
    }

    使用后执行的js函数(thisArg, cls) {
      const 物品列表 = Game.状态.物品;
      const 客人索引 = 物品列表.indexOf(thisArg);
      
      if (客人索引 < 0) {
        Game.消息队列添加("客人已不存在！", "错误");
        return false;
      }

      // 如果客人已经在最顶部，直接消失
      if (客人索引 === 0) {
        Game.状态.物品.splice(客人索引, 1);
        Game.消息队列添加("客人离开了。", "客人离开");
        Game.渲染();
        return true;
      }

      // 获取上一个物品
      const 上一个物品 = 物品列表[客人索引 - 1];
      
      if (!上一个物品) {
        // 没有上一个物品，客人消失
        Game.状态.物品.splice(客人索引, 1);
        Game.消息队列添加("客人离开了。", "客人离开");
        Game.渲染();
        return true;
      }

      // 检查上一个物品是否是菜
      if (上一个物品.constructor && 上一个物品.constructor.名字 === "菜") {
        // 检查支付能力
        if (thisArg.最大支付能力 >= 上一个物品.价值) {
          // 支付成功，菜和客人一起消失，加钱
          const 菜价值 = 上一个物品.价值;
          Game.状态.钱 += 菜价值;
          
          // 移除菜
          const 菜索引 = 物品列表.indexOf(上一个物品);
          if (菜索引 >= 0) {
            Game.状态.物品.splice(菜索引, 1);
          }
          
          // 移除客人
          const 新客人索引 = Game.状态.物品.indexOf(thisArg);
          if (新客人索引 >= 0) {
            Game.状态.物品.splice(新客人索引, 1);
          }
          
          Game.消息队列添加(`客人购买了菜，支付了${菜价值}元！`, "客人购买");
          Game.渲染();
          return true;
        } else {
          // 支付能力不足，交换位置
          const 临时 = 物品列表[客人索引];
          物品列表[客人索引] = 物品列表[客人索引 - 1];
          物品列表[客人索引 - 1] = 临时;
          Game.消息队列添加("客人负担不起这道菜，与菜交换了位置。", "客人移动");
          Game.渲染();
          return true;
        }
      } else {
        // 不是菜，交换位置
        const 临时 = 物品列表[客人索引];
        物品列表[客人索引] = 物品列表[客人索引 - 1];
        物品列表[客人索引 - 1] = 临时;
        Game.消息队列添加("客人向前移动了。", "客人移动");
        Game.渲染();
        return true;
      }
    }

    显示附加文本所用js函数(thisArg, cls) {
      if (thisArg.是富客) {
        return "（富客）";
      } else {
        return `（最大支付能力：${thisArg.最大支付能力}）`;
      }
    }

    卖掉时执行的js函数(thisArg, cls) {
      if (thisArg.是富客) {
        Game.消息队列添加(`卖出了富客，获得${thisArg.卖掉的价值}元。`, "卖出成功");
      } else {
        Game.消息队列添加("普通客人卖掉不给钱。", "卖出提示");
      }
      return true;
    }
  }

  // ==================== 插件初始化 ====================
  
  // 注册所有类
  Game.注入物品类(锅);
  Game.注入物品类(菜);
  Game.注入物品类(客人);
  
  Game.注入商店类(厨房商店);
  Game.注入地点类(厨房);

  // 将厨房添加到农场的指向地点
  const 农场类 = Game.地点类列表["农场"];
  if (农场类 && 农场类.数据 && 农场类.数据.指向地点) {
    // 检查是否已存在
    const 已存在 = 农场类.数据.指向地点.some(地点 => 地点.地点 === "厨房");
    if (!已存在) {
      农场类.数据.指向地点.push({ 地点: "厨房", 显示的文本: "前往厨房" });
    }
  }

  Game.消息队列添加("厨房扩展插件加载完成！现在可以从农场前往厨房了。", "插件加载");

})();

