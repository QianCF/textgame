(function () {
  "use strict";
  Game.状态.扩展 = Game.状态.扩展 || {};
  Game.状态.钱 = 20;
  class 苹果 {
    static 名字 = "苹果";
    constructor(data) {
      this.描述 = "看起来很好吃。";
      this.卖掉的价值 = 2;
      this.实例数据 = data || {};
    }
    static 数据 = { 全局吃过苹果次数: 0 };
    卖掉时执行的js函数(thisArg, cls) {
      return true;
    }
    能否使用(thisArg, cls) {
      return true;
    }
    使用后执行的js函数(thisArg, cls) {
      const 状态 = Game.状态;
      cls.数据.全局吃过苹果次数 += 1;
      状态.钱 += 1;
      Game.消息队列添加("你吃掉了一个苹果，感觉精神了一点（钱 +1）。", "使用物品");
      const idx = 状态.物品.indexOf(thisArg);
      if (idx >= 0) 状态.物品.splice(idx, 1);
      return true;
    }
    不持有到持有时执行的js函数(thisArg, cls, shopCls) {
      Game.消息队列添加("获得物品：苹果", "获得");
    }
    持有到不持有时执行的js函数(thisArg, cls) {
      return true;
    }
    加载时执行的js函数(thisArg, cls) {
      return true;
    }
    显示附加文本所用js函数(thisArg, cls) {
      return "（吃过苹果次数：" + cls.数据.全局吃过苹果次数 + "）";
    }
  }

  class 钥匙 {
    static 名字 = "钥匙";
    constructor(data) {
      this.描述 = "一把旧钥匙。";
      this.卖掉的价值 = 1;
      this.实例数据 = data || {};
      this.实例数据.用途 = this.实例数据.用途 || "打开某个东西";
    }
    static 数据 = {};
    卖掉时执行的js函数(thisArg, cls) {
      Game.消息队列添加("这把钥匙看起来很重要，不能卖。", "卖出失败");
      return false;
    }
    能否使用(thisArg, cls) {
      return Game.状态.所在地点 === "起点";
    }
    使用后执行的js函数(thisArg, cls) {
      const 状态 = Game.状态;
      Game.消息队列添加("你用钥匙打开了起点旁的小盒子，发现了 5 块钱。", "使用物品");
      状态.钱 += 5;
      const idx = 状态.物品.indexOf(thisArg);
      if (idx >= 0) 状态.物品.splice(idx, 1);
      return true;
    }
    不持有到持有时执行的js函数(thisArg, cls, shopCls) {
      Game.消息队列添加("获得物品：钥匙", "获得");
    }
    持有到不持有时执行的js函数(thisArg, cls) {
      return true;
    }
    加载时执行的js函数(thisArg, cls) {
      return true;
    }
    显示附加文本所用js函数(thisArg, cls) {
      return "（用途：" + thisArg.实例数据.用途 + "）";
    }
  }

  Game.注入物品类(苹果);
  Game.注入物品类(钥匙);

  // ---- 商店 ----
  class 杂货店 {
    static 名字 = "杂货店";
    static 显示的文本 = "欢迎光临。";
    static 其它数据 = {};
    static 数据 = [
      {
        物品名: "苹果",
        价格: 3,
        购买时执行的js函数(cls, 物品名, 条目) {
          return true;
        },
        物品数据: {},
        显示商店对物品附加文本所用js函数(cls, 物品名, 条目) {
          return "（吃了会+1钱）";
        },
      },
      {
        物品名: "钥匙",
        价格: 8,
        购买时执行的js函数(cls, 物品名, 条目) {
          console.log(Game.状态.物品)
          const already = Game.状态.物品.some((x) => x && x.constructor.名字 === "钥匙");
          if (already) {
            Game.消息队列添加("你已经有一把钥匙了。", "购买失败");
            return false;
          }
          return true;
        },
        物品数据: { 用途: "打开起点旁的小盒子" },
        显示商店对物品附加文本所用js函数(cls, 物品名, 条目) {
          return "（只能有一把，且不能卖）";
        },
      },
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

  Game.注入商店类(杂货店);

  // ---- 对话 ----
  class 森林邂逅对话 {
    constructor() {
      this.标题 = "森林邂逅";
      this.消息 = [
        {
          人名: "陌生人",
          内容: "你也来森林散步吗？",
          按钮: [
            {
              显示文本: "是的",
              按下调用的js函数(thisArg, cls, msg, idx, btn) {
                return true;
              },
              判断是否禁用而被系统频繁调用的js函数(thisArg, cls, msg, idx, btn) {
                return true;
              },
            },
            {
              显示文本: "不是，我迷路了",
              按下调用的js函数(thisArg, cls, msg, idx, btn) {
                // 使用 thisArg（对话实例）重写后续消息，让下一条变成“送你回起点”
                thisArg.消息.splice(1, thisArg.消息.length, {
                  人名: "陌生人",
                  内容: "别担心，我送你回起点。",
                  进入时调用的js函数(thisArg2, cls2, msg2, idx2) {
                    Game.进入地点("起点", false);
                    return true;
                  },
                  按钮: [
                    {
                      显示文本: "谢谢",
                      按下调用的js函数(thisArg3, cls3, msg3, idx3, btn3) {
                        return true;
                      },
                      判断是否禁用而被系统频繁调用的js函数(thisArg3, cls3, msg3, idx3, btn3) {
                        return true;
                      },
                    },
                  ],
                  用户退出时调用的js函数(thisArg2, cls2, msg2, idx2) {
                    return true;
                  },
                });
                return true;
              },
              判断是否禁用而被系统频繁调用的js函数(thisArg, cls, msg, idx, btn) {
                return true;
              },
            },
          ],
          用户退出时调用的js函数(thisArg, cls, msg, idx) {
            Game.消息队列添加("对话中不能直接退出，请选择一个回答。", "提示");
            return false;
          },
        },
        {
          人名: "陌生人",
          内容: "那就好。路上小心。",
          按钮: [
            {
              显示文本: "再见",
              按下调用的js函数(thisArg, cls, msg, idx, btn) {
                return true;
              },
              判断是否禁用而被系统频繁调用的js函数(thisArg, cls, msg, idx, btn) {
                return true;
              },
            },
          ],
          用户退出时调用的js函数(thisArg, cls, msg, idx) {
            return true;
          },
        },
      ];
    }
  }

  // ---- 地点 ----
  class 起点 {
    static 名字 = "起点";
    static 显示的文本 = "你站在起点。前方有一条小路通往森林。";
    static 其它数据 = {};
    static 数据 = {
      指向地点: [{ 地点: "森林", 显示的文本: "去森林" }],
      商店: ["杂货店"],
      按钮: [
        {
          显示文本: "查看告示牌",
          按下调用的js函数(cls, btn) {
            Game.消息队列添加("告示牌写着：欢迎来到示例世界。", "告示牌");
            return true;
          },
          判断是否禁用而被系统频繁调用的js函数(cls, btn) {
            return true;
          },
        },
      ],
    };
    static 进入时执行的js函数(cls, from地点名, fromCls, 从点击进入) {
      const 状态 = Game.状态;
      if (!状态.扩展.来过起点) {
        状态.扩展.来过起点 = true;
        Game.消息队列添加("第一次来到起点。你有一些钱可以去商店看看。", "提示");
      }
      return true;
    }
    static 离开时执行的js函数(cls, to地点名, toCls) {
      return true;
    }
    static 加载时执行的js函数(cls) {
      return true;
    }
    static 检查是否允许进入的js函数(cls, from地点名, fromCls, 从点击进入) {
      return true;
    }
    static 判断是否禁用而被系统频繁调用的js函数(cls, 当前地点名, 当前地点cls) {
      return true;
    }
  }

  class 森林 {
    static 名字 = "森林";
    static 显示的文本 = "森林里很安静，你听到风吹过树叶的声音。";
    static 其它数据 = {};
    static 数据 = {
      指向地点: [{ 地点: "起点", 显示的文本: "回到起点" }],
      商店: [],
      按钮: [
        {
          显示文本: "捡点零钱",
          按下调用的js函数(cls, btn) {
            const 状态 = Game.状态;
            if (状态.扩展.森林捡过钱) {
              Game.消息队列添加("地上已经没有零钱了。", "行动");
              return true;
            }
            状态.扩展.森林捡过钱 = true;
            状态.钱 += 2;
            Game.消息队列添加("你捡到了 2 块钱。", "行动");
            return true;
          },
          判断是否禁用而被系统频繁调用的js函数(cls, btn) {
            return !(Game.状态.扩展 && Game.状态.扩展.森林捡过钱);
          },
        },
        {
          显示文本: "和陌生人说话",
          按下调用的js函数(cls, btn) {
            Game.显示对话(new 森林邂逅对话());
            return true;
          },
          判断是否禁用而被系统频繁调用的js函数(cls, btn) {
            return true;
          },
        },
      ],
    };
    static 进入时执行的js函数(cls, from地点名, fromCls, 从点击进入) {
      return true;
    }
    static 离开时执行的js函数(cls, to地点名, toCls) {
      return true;
    }
    static 加载时执行的js函数(cls) {
      return true;
    }
    static 检查是否允许进入的js函数(cls, from地点名, fromCls, 从点击进入) {
      const 状态 = Game.状态;
      if (状态.物品.length >= 5) {
        Game.消息队列添加("你背包太满了，挤不进森林。", "无法进入");
        return false;
      }
      return true;
    }
    static 判断是否禁用而被系统频繁调用的js函数(cls, 当前地点名, 当前地点cls) {
      return true;
    }
  }

  Game.注入地点类(起点);
  Game.注入地点类(森林);
})();


