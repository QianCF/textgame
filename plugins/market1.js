// market.js - 市场扩展插件
(function () {
  "use strict";

  // ==================== 市场地点 ====================
  class 市场 {
    static 名字 = "市场";
    static 显示的文本 = "热闹的市场，这里可以雇佣人力资源和购买畜力资源。";

    static 数据 = {
      指向地点: [
        { 地点: "银行", 显示的文本: "返回银行" },
      ],
      商店: ["人力资源商店", "畜力资源商店"],
      按钮: []
    };

    static 进入时执行的js函数(cls, from地点名, fromCls, 从点击进入) {
      市场.显示的文本 = "热闹的市场，这里可以雇佣人力资源和购买畜力资源。";
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

  // ==================== 畜力资源商店 ====================
  class 畜力资源商店 {
    static 名字 = "畜力资源商店";
    static 显示的文本 = "这里出售各种牲畜，可以帮助你管理农场。";

    static 数据 = [
      {
        物品名: "猪",
        价格: 40,
        物品数据: {
          饱食值: 0,
          最大饱食值: 50
        },
        显示商店对物品附加文本所用js函数: (cls, 条目) => {
          return "（喂养后可增值卖出）";
        }
      },
      {
        物品名: "牛",
        价格: 50,
        物品数据: {},
        显示商店对物品附加文本所用js函数: (cls, 条目) => {
          return "（具有管理能力）";
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

  // ==================== 物品类：猪 ====================
  class 猪 {
    static 名字 = "猪";

    constructor(data) {
      this.描述 = "一只可爱的猪，喂养后可以增值。";
      this.卖掉的价值 = 40;
      this.饱食值 = data?.饱食值 || 0;
      this.最大饱食值 = data?.最大饱食值 || 50;
      this.能否使用 = this.饱食值 < this.最大饱食值;
    }

    使用后执行的js函数(thisArg, cls) {
      // 显示喂养界面
      Game.显示对话(new 喂养猪对话(thisArg));
      return false; // 不自动消耗
    }

    卖掉时执行的js函数(thisArg, cls) {
      // 根据饱食度调整售价
      if (thisArg.饱食值 >= thisArg.最大饱食值) {
        Game.消息队列添加("卖出一只饱食的猪，获得140元！", "卖出成功");
      } else {
        Game.消息队列添加("卖出一只普通猪，获得40元。", "卖出成功");
      }
      if (Game.农场工具 && Game.农场工具.时间流逝检测) {
        Game.农场工具.时间流逝检测();
      }
      return true;
    }

    显示附加文本所用js函数(thisArg, cls) {
      if (thisArg.饱食值 >= thisArg.最大饱食值) {
        return `（饱食度：${thisArg.饱食值}/${thisArg.最大饱食值}，已饱食）`;
      }
      return `（饱食度：${thisArg.饱食值}/${thisArg.最大饱食值}）`;
    }

    // 喂食方法
    喂食(thisArg, 食物名称, 数量) {
      let 增加饱食值 = 0;
      
      switch(食物名称) {
        case "小麦":
          增加饱食值 = 1;
          break;
        case "土豆":
          增加饱食值 = 3;
          break;
        case "胡萝卜":
          增加饱食值 = 6;
          break;
        default:
          return false;
      }
      
      const 总增加量 = 增加饱食值 * 数量;
      thisArg.饱食值 += 总增加量;
      
      // 限制最大饱食值
      if (thisArg.饱食值 > thisArg.最大饱食值) {
        thisArg.饱食值 = thisArg.最大饱食值;
      }
      
      // 更新能否使用状态
      thisArg.能否使用 = thisArg.饱食值 < thisArg.最大饱食值;
      
      return true;
    }
  }

  // ==================== 喂养猪对话 ====================
  class 喂养猪对话 {
    constructor(猪实例) {
      this.标题 = "喂养猪";
      this.猪实例 = 猪实例;
      this.消息 = [];
      this.更新消息();
    }

    更新消息() {
      // 检查猪是否已经饱食
      if (this.猪实例.饱食值 >= this.猪实例.最大饱食值) {
        this.消息 = [{
          内容: "这只猪已经吃饱了！",
          进入时调用的js函数: (thisArg, cls, msg, idx) => {
            // 留在本页，避免引擎自动跳到“下一条消息”导致界面消失
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

      // 搜索背包中的食物（不递归）
      const 背包物品 = Game.状态.物品;
      const 食物列表 = this.获取食物列表(背包物品);

      if (食物列表.length === 0) {
        this.消息 = [{
          内容: "背包中没有小麦、土豆或胡萝卜可以喂养。",
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

      this.消息 = [{
        内容: `选择食物喂养猪（当前饱食度：${this.猪实例.饱食值}/${this.猪实例.最大饱食值}）`,
        进入时调用的js函数: (thisArg, cls, msg, idx) => {
          thisArg.__阻止自动下一条 = true;
        },
        按钮: []
      }];

      // 添加食物按钮
      食物列表.forEach(食物 => {
        const 食物名称 = 食物.constructor.名字;
        let 增加饱食值 = 0;
        let 使用文本 = "";
        
        switch(食物名称) {
          case "小麦":
            增加饱食值 = 1;
            使用文本 = "+1饱食值";
            break;
          case "土豆":
            增加饱食值 = 3;
            使用文本 = "+3饱食值";
            break;
          case "胡萝卜":
            增加饱食值 = 6;
            使用文本 = "+6饱食值";
            break;
        }

        const 猪id = this.猪实例.__物品id || (this.猪实例.__物品id = Date.now() + '-' + Math.random().toString(36).substr(2, 9));
        const 食物id = 食物.__物品id || (食物.__物品id = Date.now() + '-' + Math.random().toString(36).substr(2, 9));

        this.消息[0].按钮.push({
          显示文本: `${食物名称}（${使用文本}）`,
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            // 重新获取猪实例
            const 当前猪 = Game.状态.物品.find(item => item.__物品id === 猪id);
            if (!当前猪) {
              Game.消息队列添加("猪已不存在！", "错误");
              return;
            }

            // 重新获取食物实例
            const 当前食物 = Game.状态.物品.find(item => item.__物品id === 食物id);
            if (!当前食物) {
              Game.消息队列添加("食物已不存在！", "错误");
              return;
            }

            // 从背包移除食物
            const 食物索引 = Game.状态.物品.indexOf(当前食物);
            if (食物索引 >= 0) {
              Game.状态.物品.splice(食物索引, 1);
            }

            // 喂食
            const 喂食成功 = 当前猪.喂食(当前猪, 食物名称, 1);
            
            if (喂食成功) {
              Game.消息队列添加(`用${食物名称}喂养了猪，饱食度+${增加饱食值}。`, "喂养成功");
              
              // 如果猪还没饱，继续显示喂养界面
              if (当前猪.饱食值 < 当前猪.最大饱食值) {
                thisArg.猪实例 = 当前猪;
                thisArg.更新消息();
                Game.渲染();
              } else {
                当前猪.卖掉的价值=140;
                Game.消息队列添加("猪已经吃饱了，可以卖出高价了！", "喂养完成");
                Game.关闭对话();
              }
            }
          }
        });
      });

      // 添加返回按钮
      this.消息[0].按钮.push({
        显示文本: "返回",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          Game.关闭对话();
          return true;
        }
      });
    }

    获取食物列表(物品列表) {
      const 食物名称列表 = ["小麦", "土豆", "胡萝卜"];
      return 物品列表.filter(item => {
        if (!item || !item.constructor) return false;
        return 食物名称列表.includes(item.constructor.名字);
      });
    }
  }

  // ==================== 物品类：牛 ====================
  class 牛 {
    static 名字 = "牛";

    constructor(data) {
      this.描述 = "一头能干的牛，可以帮助你管理农场。";
      this.卖掉的价值 = 30;
      this.能否使用 = true;
    }

    使用后执行的js函数(thisArg, cls) {
      // 显示牛的功能选择界面
      Game.显示对话(new 牛功能对话(thisArg));
      return false;
    }

    显示附加文本所用js函数(thisArg, cls) {
      return "（管理助手）";
    }

    // 方法1：背包排序
    背包排序() {
      // 获取背包物品（不递归）
      const 背包物品 = Game.状态.物品;
      
      // 过滤掉无效物品
      const 有效物品 = 背包物品.filter(item => item && item.constructor);
      
      // 获取物品附加文本的辅助函数
      const 获取附加文本 = (item) => {
        if (!item) return "";
        // 如果有显示附加文本所用js函数，按照规范调用（传入thisArg和cls）
        if (typeof item.显示附加文本所用js函数 === "function") {
          try {
            return item.显示附加文本所用js函数(item, item.constructor) || "";
          } catch (e) {
            return "";
          }
        }
        // 如果没有函数，返回空字符串
        return "";
      };
      
      // 按物品名字排序，相同名字的按附加文本排序
      有效物品.sort((a, b) => {
        const 名字A = a.constructor.名字 || "";
        const 名字B = b.constructor.名字 || "";
        const 名字比较 = 名字A.localeCompare(名字B);
        
        // 如果名字相同，继续比较附加文本
        if (名字比较 === 0) {
          const 附加文本A = 获取附加文本(a);
          const 附加文本B = 获取附加文本(b);
          return 附加文本A.localeCompare(附加文本B);
        }
        
        return 名字比较;
      });
      
      // 重新设置物品数组（保持引用）
      Game.状态.物品.length = 0;
      有效物品.forEach(item => {
        Game.状态.物品.push(item);
      });
      
      Game.消息队列添加("背包已按物品名字和附加文本排序。", "排序完成");
      Game.渲染();
      return true;
    }

    // 方法2：展开收纳袋
    展开收纳袋(收纳袋实例) {
      if (!收纳袋实例 || !收纳袋实例.内部物品) {
        return false;
      }
      
      const 内部物品 = 收纳袋实例.内部物品;
      if (内部物品.length === 0) {
        Game.消息队列添加("收纳袋是空的。", "提示");
        return false;
      }
      
      // 记录展开数量
      const 展开数量 = 内部物品.length;
      
      // 将内部物品添加到当前层级
      内部物品.forEach(item => {
        // 移除内部ID标记
        if (item.__收纳袋id) {
          delete item.__收纳袋id;
        }
        Game.状态.物品.push(item);
      });
      
      // 清空收纳袋
      收纳袋实例.内部物品 = [];
      
      
      Game.消息队列添加(`展开收纳袋，释放出${展开数量}个物品。`, "展开完成");
      Game.渲染();
      return true;
    }

    // 方法3：快速种田
    快速种田(作物名称, 土地实例) {
      if (!土地实例 || 土地实例.constructor.名字 !== "土地") {
        return false;
      }
      
      // 检查土地状态
      if (土地实例.状态 !== '空闲') {
        Game.消息队列添加(`土地${土地实例.id + 1}不是空闲状态。`, "种植失败");
        return false;
      }
      
      // 检查是否有种子
      const 种子名称 = 作物名称 + "种子";
      const 种子索引 = Game.状态.物品.findIndex(item => 
        item && item.constructor.名字 === 种子名称
      );
      
      if (种子索引 < 0) {
        Game.消息队列添加(`没有${种子名称}。`, "种植失败");
        return false;
      }
      
      // 检查当前季节
      const 农场数据 = Game.状态.农场数据;
      if (农场数据) {
        const 当前季节 = 农场数据.时间.季;
        const 是否生长季 = Game.农场工具 && Game.农场工具.检查是否生长季
          ? Game.农场工具.检查是否生长季(作物名称, 当前季节)
          : true; // 如果farm.js未加载，默认允许种植
        
        if (!是否生长季) {
          const 季节名称 = Game.农场工具 && Game.农场工具.获取季节名称
            ? Game.农场工具.获取季节名称(当前季节)
            : ['春', '夏', '秋', '冬'][当前季节 - 1] || '未知';
          Game.消息队列添加(`当前是${季节名称}季，不适合${作物名称}生长。`, "季节警告");
        }
      }
      
      // 种植逻辑
      土地实例.状态 = '生长中';
      土地实例.作物 = 作物名称;
      土地实例.进度 = 0;
      土地实例.已生长小时数 = 0;
      
      if (农场数据) {
        土地实例.上次检查时间 = Game.农场工具 && Game.农场工具.时间到总小时数
          ? Game.农场工具.时间到总小时数(农场数据.时间)
          : (农场数据.时间.季 - 1) * 72 + (农场数据.时间.日 - 1) * 24 + 农场数据.时间.时;
      }
      
      土地实例.能否使用 = false;
      
      // 消耗种子
      Game.状态.物品.splice(种子索引, 1);
      
      // 检查任务
      if (农场数据 && 农场数据.任务 && Game.农场工具 && Game.农场工具.检查任务完成) {
        Game.农场工具.检查任务完成('种植', 作物名称);
      }
      
      Game.消息队列添加(`在土地${土地实例.id + 1}种植了${作物名称}。`, "种植成功");
      
      // 更新农场显示
      if (Game.农场工具 && Game.农场工具.时间流逝检测) {
        Game.农场工具.时间流逝检测();
      }
      Game.渲染();
      return true;
    }

    // 方法4：收获土地（依赖 farm.js 的 土地.使用后执行的js函数 行为）
    收获土地(土地实例) {
      if (!土地实例 || !土地实例.constructor || 土地实例.constructor.名字 !== "土地") return false;
      if (土地实例.状态 !== '可收获') return false;
      if (typeof 土地实例.使用后执行的js函数 === "function") {
        return 土地实例.使用后执行的js函数(土地实例, 土地实例.constructor) !== false;
      }
      return false;
    }

    // 方法5：一键收获所有可收获土地
    一键收获所有土地() {
      const 所有土地 = 递归查找所有土地(Game.状态.物品);
      const 可收获土地 = 所有土地.filter(t => t && t.状态 === '可收获');
      if (可收获土地.length === 0) {
        Game.消息队列添加("没有可收获的土地。", "收获");
        return false;
      }
      let 收获块数 = 0;
      可收获土地.forEach(t => {
        const ok = this.收获土地(t);
        if (ok) 收获块数 += 1;
      });
      Game.消息队列添加(`一键收获完成：收获了${收获块数}块土地。`, "收获");
      Game.渲染();
      return true;
    }

    // 方法8：一键种田
    一键种田(作物名称) {
      // 获取所有土地并按id排序
      const 所有土地 = 递归查找所有土地(Game.状态.物品);
      const 空闲土地 = 所有土地
        .filter(t => t && t.状态 === '空闲')
        .sort((a, b) => (a.id || 0) - (b.id || 0)); // 按id从小到大排序
      
      if (空闲土地.length === 0) {
        Game.消息队列添加("没有空闲的土地可供种植。", "一键种田");
        return false;
      }

      const 种子名称 = 作物名称 + "种子";
      let 种植块数 = 0;

      // 从第一个土地开始，逐个种植
      for (const 土地 of 空闲土地) {
        // 检查是否还有种子
        const 种子索引 = Game.状态.物品.findIndex(item => 
          item && item.constructor && item.constructor.名字 === 种子名称
        );
        
        if (种子索引 < 0) {
          // 种子用完了
          if (种植块数 > 0) {
            Game.消息队列添加(`种子已用完，已种植${种植块数}块土地。`, "一键种田");
          } else {
            Game.消息队列添加(`没有${种子名称}。`, "一键种田");
          }
          break;
        }

        // 尝试种植这块土地
        const 成功 = this.快速种田(作物名称, 土地);
        if (成功) {
          种植块数++;
        }
      }

      if (种植块数 > 0) {
        Game.消息队列添加(`一键种田完成：种植了${种植块数}块土地。`, "一键种田");
      }
      
      // 更新农场显示
      if (Game.农场工具 && Game.农场工具.时间流逝检测) {
        Game.农场工具.时间流逝检测();
      }
      Game.渲染();
      return true;
    }

    // 方法6：一键收取所有老板资金
    一键收取所有老板工资() {
      const 所有老板 = 递归查找所有老板(Game.状态.物品);
      if (!所有老板 || 所有老板.length === 0) {
        Game.消息队列添加("没有老板可以收取资金。", "老板工资");
        return false;
      }
      let 总额 = 0;
      所有老板.forEach(boss => {
        const 金额 = Number(boss && boss.钱 ? boss.钱 : 0);
        if (金额 > 0) {
          总额 += 金额;
          boss.钱 = 0;
        }
      });
      if (总额 > 0) {
        Game.状态.钱 += 总额;
        Game.消息队列添加(`一键收取老板资金：获得${总额}元。`, "老板工资");
      } else {
        Game.消息队列添加("所有老板都没有可收取的资金。", "老板工资");
      }
      Game.渲染();
      return true;
    }

    // 方法7：自动卖菜
    自动卖菜(菜名称) {
      // 获取背包第一层物品（不递归）
      const 背包物品 = Game.状态.物品;
      
      // 过滤出指定名称的菜
      const 要卖出的菜 = 背包物品.filter(item => {
        if (!item || !item.constructor) return false;
        return item.constructor.名字 === 菜名称;
      });
      
      if (要卖出的菜.length === 0) {
        Game.消息队列添加(`背包中没有${菜名称}可以卖出。`, "自动卖菜");
        return false;
      }
      
      // 逐个卖出
      let 卖出数量 = 0;
      要卖出的菜.forEach(菜 => {
        const 成功 = Game.卖出物品(菜);
        if (成功) {
          卖出数量++;
        }
      });
      
      if (卖出数量 > 0) {
        Game.消息队列添加(`自动卖出${卖出数量}个${菜名称}。`, "自动卖菜");
      } else {
        Game.消息队列添加(`未能卖出任何${菜名称}。`, "自动卖菜");
      }
      
      Game.渲染();
      return true;
    }
  }

  // ==================== 牛功能对话 ====================
  class 牛功能对话 {
    constructor(牛实例) {
      this.标题 = "牛的功能";
      this.牛实例 = 牛实例;
      this.消息 = [];
      this.更新消息();
    }

    更新消息() {
      this.消息 = [{
        内容: "选择要使用的功能：",
        按钮: [
          {
            显示文本: "背包排序",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.牛实例.背包排序();
              Game.关闭对话();
              return true;
            }
          },
          {
            显示文本: "展开收纳袋",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.显示收纳袋选择界面();
              return true;
            }
          },
          {
            显示文本: "快速种田",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.显示作物选择界面();
              return true;
            }
          },
          {
            显示文本: "收田",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.显示收田界面();
              return true;
            }
          },
          {
            显示文本: "一键收取老板工资",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              // 留在当前界面（否则idx++会走完对话）
              thisArg.__阻止自动下一条 = true;
              thisArg.牛实例.一键收取所有老板工资();
              return true;
            }
          },
          {
            显示文本: "自动卖菜",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.显示菜选择界面();
              return true;
            }
          },
          {
            显示文本: "返回",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              Game.关闭对话();
              return true;
            }
          }
        ]
      }];
    }

    显示收纳袋选择界面() {
      // 递归查找所有收纳袋
      const 所有收纳袋 = 递归查找所有收纳袋(Game.状态.物品);
      
      if (所有收纳袋.length === 0) {
        this.消息 = [this.消息[0], {
          内容: "没有找到收纳袋。",
          进入时调用的js函数: (thisArg, cls, msg, idx) => {
            thisArg.__阻止自动下一条 = true;
          },
          按钮: [{
            显示文本: "返回",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.__阻止自动下一条 = true;
              thisArg.更新消息();
              Game.渲染();
              return true;
            }
          }]
        }];
        Game.渲染();
        return;
      }

      const 收纳袋消息 = {
        内容: "选择要展开的收纳袋：",
        进入时调用的js函数: (thisArg, cls, msg, idx) => {
          thisArg.__阻止自动下一条 = true;
        },
        按钮: []
      };

      所有收纳袋.forEach(收纳袋 => {
        const 收纳袋id = 收纳袋.__物品id || (收纳袋.__物品id = Date.now() + '-' + Math.random().toString(36).substr(2, 9));
        
        收纳袋消息.按钮.push({
          显示文本: `收纳袋（${收纳袋.内部物品.length}个物品）`,
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            // 重新获取收纳袋实例
            const 当前收纳袋 = 递归查找所有收纳袋(Game.状态.物品).find(item => item.__物品id === 收纳袋id);
            
            if (当前收纳袋) {
              thisArg.牛实例.展开收纳袋(当前收纳袋);
              Game.关闭对话();
            }
            return true;
          }
        });
      });

      收纳袋消息.按钮.push({
        显示文本: "返回",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          // 直接回到主菜单：重新打开对话以重置idx
          const 牛id = thisArg.牛实例 && thisArg.牛实例.__物品id;
          const 当前牛 = 牛id ? Game.状态.物品.find(it => it && it.__物品id === 牛id) : thisArg.牛实例;
          if (当前牛) Game.显示对话(new 牛功能对话(当前牛));
          return true;
        }
      });

      this.消息 = [this.消息[0], 收纳袋消息];
      Game.渲染();
    }

    显示作物选择界面() {
      const 作物列表 = ["小麦", "土豆", "胡萝卜"];
      
      const 作物消息 = {
        内容: "选择要种植的作物：",
        按钮: []
      };

      作物列表.forEach(作物名称 => {
        作物消息.按钮.push({
          显示文本: 作物名称,
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            // 关键：这里要“追加”选田页作为下一条消息，让引擎 idx++ 正常进入选田页
            thisArg.显示土地选择界面(作物名称, true);
            return true;
          }
        });
      });

      作物消息.按钮.push({
        显示文本: "返回",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          // 回到主菜单：重新打开对话以重置idx
          const 牛id = thisArg.牛实例 && thisArg.牛实例.__物品id;
          const 当前牛 = 牛id ? Game.状态.物品.find(it => it && it.__物品id === 牛id) : thisArg.牛实例;
          if (当前牛) Game.显示对话(new 牛功能对话(当前牛));
          return true;
        }
      });

      this.消息 = [this.消息[0], 作物消息];
      Game.渲染();
    }

    显示土地选择界面(作物名称, 保留作物选择页 = false) {
      // 递归查找所有土地
      const 所有土地 = 递归查找所有土地(Game.状态.物品);
      const 空闲土地 = 所有土地.filter(土地 => 土地.状态 === '空闲');
      
      if (空闲土地.length === 0) {
        this.消息 = [this.消息[0], {
          内容: "没有空闲的土地可供种植。",
          进入时调用的js函数: (thisArg, cls, msg, idx) => {
            thisArg.__阻止自动下一条 = true;
          },
          按钮: [{
            显示文本: "返回",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              // 回到牛主菜单（重置idx，避免idx越界）
              const 牛id = thisArg.牛实例 && thisArg.牛实例.__物品id;
              const 当前牛 = 牛id ? Game.状态.物品.find(it => it && it.__物品id === 牛id) : thisArg.牛实例;
              if (当前牛) Game.显示对话(new 牛功能对话(当前牛));
              return true;
            }
          }]
        }];
        Game.渲染();
        return;
      }

      const 土地消息 = {
        内容: `选择要种植${作物名称}的土地：`,
        进入时调用的js函数: (thisArg, cls, msg, idx) => {
          thisArg.__阻止自动下一条 = true;
        },
        按钮: []
      };

      // 添加一键种田按钮
      土地消息.按钮.push({
        显示文本: "一键种田",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          thisArg.__阻止自动下一条 = true;
          thisArg.牛实例.一键种田(作物名称);
          // 重新显示土地选择界面，以便继续操作
          thisArg.显示土地选择界面(作物名称, true);
          return true;
        }
      });

      空闲土地.forEach(土地 => {
        const 土地id = 土地.__物品id || (土地.__物品id = Date.now() + '-' + Math.random().toString(36).substr(2, 9));
        
        土地消息.按钮.push({
          显示文本: `土地 ${土地.id + 1}`,
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            // 选田页是可重复操作：阻止自动下一条，避免只种一块就退出
            thisArg.__阻止自动下一条 = true;
            // 重新获取土地实例
            const 当前土地 = 递归查找所有土地(Game.状态.物品).find(item => item.__物品id === 土地id);
            
            if (当前土地) {
              thisArg.牛实例.快速种田(作物名称, 当前土地);
              // 不关闭对话，让用户可以继续种植
              // 关键：保持消息条数不变（仍保留“作物选择页”），避免idx越界导致对话结束
              thisArg.显示土地选择界面(作物名称, true);
            }
            return true;
          }
        });
      });

      土地消息.按钮.push({
        显示文本: "返回",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          // 回到牛主菜单（重置idx，避免idx越界）
          const 牛id = thisArg.牛实例 && thisArg.牛实例.__物品id;
          const 当前牛 = 牛id ? Game.状态.物品.find(it => it && it.__物品id === 牛id) : thisArg.牛实例;
          if (当前牛) Game.显示对话(new 牛功能对话(当前牛));
          return true;
        }
      });

      if (保留作物选择页 && this.消息.length >= 2) {
        this.消息 = [this.消息[0], this.消息[1], 土地消息];
      } else {
        this.消息 = [this.消息[0], 土地消息];
      }
      Game.渲染();
    }

    显示收田界面() {
      const 所有土地 = 递归查找所有土地(Game.状态.物品);
      const 可收获土地 = 所有土地.filter(t => t && t.状态 === '可收获');

      const 收田消息 = {
        内容: 可收获土地.length > 0
          ? `选择要收获的土地（可收获：${可收获土地.length}块）：`
          : "目前没有可收获的土地。",
        进入时调用的js函数: (thisArg, cls, msg, idx) => {
          thisArg.__阻止自动下一条 = true;
        },
        按钮: []
      };

      收田消息.按钮.push({
        显示文本: "一键收取",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          thisArg.__阻止自动下一条 = true;
          thisArg.牛实例.一键收获所有土地();
          thisArg.显示收田界面();
          return true;
        }
      });

      可收获土地.forEach(土地 => {
        const 土地id = 土地.__物品id || (土地.__物品id = Date.now() + '-' + Math.random().toString(36).substr(2, 9));
        收田消息.按钮.push({
          显示文本: `土地 ${土地.id + 1}`,
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            thisArg.__阻止自动下一条 = true;
            const 当前土地 = 递归查找所有土地(Game.状态.物品).find(it => it && it.__物品id === 土地id);
            if (当前土地) {
              const ok = thisArg.牛实例.收获土地(当前土地);
              if (!ok) Game.消息队列添加("该土地无法收获。", "收获");
            }
            thisArg.显示收田界面();
            return true;
          }
        });
      });

      收田消息.按钮.push({
        显示文本: "返回",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          const 牛id = thisArg.牛实例 && thisArg.牛实例.__物品id;
          const 当前牛 = 牛id ? Game.状态.物品.find(it => it && it.__物品id === 牛id) : thisArg.牛实例;
          if (当前牛) Game.显示对话(new 牛功能对话(当前牛));
          return true;
        }
      });

      this.消息 = [this.消息[0], 收田消息];
      Game.渲染();
    }

    显示菜选择界面() {
      const 菜列表 = ["小麦", "土豆", "胡萝卜"];
      
      const 菜消息 = {
        内容: "选择要自动卖出的菜：",
        进入时调用的js函数: (thisArg, cls, msg, idx) => {
          thisArg.__阻止自动下一条 = true;
        },
        按钮: []
      };

      菜列表.forEach(菜名称 => {
        菜消息.按钮.push({
          显示文本: 菜名称,
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            // 执行自动卖菜
            thisArg.牛实例.自动卖菜(菜名称);
            // 自动退出菜单
            Game.关闭对话();
            return true;
          }
        });
      });

      菜消息.按钮.push({
        显示文本: "返回",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          // 回到牛主菜单：重新打开对话以重置idx
          const 牛id = thisArg.牛实例 && thisArg.牛实例.__物品id;
          const 当前牛 = 牛id ? Game.状态.物品.find(it => it && it.__物品id === 牛id) : thisArg.牛实例;
          if (当前牛) Game.显示对话(new 牛功能对话(当前牛));
          return true;
        }
      });

      this.消息 = [this.消息[0], 菜消息];
      Game.渲染();
    }
  }

  // ==================== 人力资源商店 ====================
  class 人力资源商店 {
    static 名字 = "人力资源商店";
    static 显示的文本 = "这里可以雇佣工人和老板，帮助你管理产业。";

    static 数据 = [
      {
        物品名: "工人",
        价格: 200,
        物品数据: {
          // 使用老板编号字段，避免存档时丢失关联
          老板编号: null
        },
        显示商店对物品附加文本所用js函数: (cls, 条目) => {
          return "（可以绑定到老板）";
        }
      },
      {
        物品名: "老板",
        价格: 100,
        物品数据: {
          编号: 0,
          钱: 0
        },
        显示商店对物品附加文本所用js函数: (cls, 条目) => {
          return "（可以管理工人）";
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

  // ==================== 物品类：工人 ====================
  class 工人 {
    static 名字 = "工人";

    constructor(data) {
      this.描述 = "一名工人，可以绑定到老板为其工作。";
      this.卖掉的价值 = 150;
      this.能否使用 = true;
      // 使用“老板编号”而不是运行期的 __物品id，方便随存档持久化
      this.老板编号 = data?.老板编号 ?? null;
    }

    使用后执行的js函数(thisArg, cls) {
      Game.显示对话(new 工人操作对话(thisArg));
      return false;
    }

    显示附加文本所用js函数(thisArg, cls) {
      if (thisArg.老板编号 != null) {
        // 按“编号”匹配老板，而不是依赖运行期ID
        const 所有老板 = 递归查找所有老板(Game.状态.物品);
        const 老板实例 = 所有老板.find(老板 => 老板.编号 === thisArg.老板编号);
        
        if (老板实例) {
          return `（老板：${老板实例.编号}号）`;
        }
        return "（老板已丢失）";
      }
      return "（未绑定）";
    }
  }

  // ==================== 工人操作对话 ====================
  class 工人操作对话 {
    constructor(工人实例) {
      this.标题 = "工人操作";
      this.工人实例 = 工人实例;
      this.消息 = [];
      this.更新消息();
    }

    更新消息() {
      // 显示绑定老板信息：如果老板已被卖掉/丢失，则显示“老板已丢失”
      let 绑定信息 = "工人未绑定老板";
      if (this.工人实例.老板编号 != null) {
        const 所有老板 = 递归查找所有老板(Game.状态.物品);
        const 老板实例 = 所有老板.find(老板 => 老板 && 老板.编号 === this.工人实例.老板编号);
        if (老板实例) {
          绑定信息 = `工人已绑定到老板（${老板实例.编号}号）`;
        } else {
          绑定信息 = "工人已绑定到老板（老板已丢失）";
        }
      }
      this.消息 = [{
        内容: 绑定信息,
        按钮: []
      }];

      // 绑定按钮
      this.消息[0].按钮.push({
        显示文本: "绑定老板",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          thisArg.显示老板选择界面();
          return true;
        }
      });

      // 如果已绑定，显示解绑按钮
      if (this.工人实例.老板编号 != null) {
        this.消息[0].按钮.push({
          显示文本: "解绑",
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            thisArg.工人实例.老板编号 = null;
            Game.消息队列添加("工人已解绑。", "解绑成功");
            // 解绑后保持在当前页：重新打开对话以重置idx
            const 工人id = thisArg.工人实例 && thisArg.工人实例.__物品id;
            const 当前工人 = 工人id ? 递归查找所有工人(Game.状态.物品).find(it => it && it.__物品id === 工人id) : thisArg.工人实例;
            if (当前工人) Game.显示对话(new 工人操作对话(当前工人));
            return true;
          }
        });
      }

      this.消息[0].按钮.push({
        显示文本: "返回",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          Game.关闭对话();
          return true;
        }
      });
    }

    显示老板选择界面() {
      const 所有老板 = 递归查找所有老板(Game.状态.物品);
      
      if (所有老板.length === 0) {
        this.消息 = [this.消息[0], {
          内容: "没有可用的老板。",
          进入时调用的js函数: (thisArg, cls, msg, idx) => {
            thisArg.__阻止自动下一条 = true;
          },
          按钮: [{
            显示文本: "返回",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              thisArg.__阻止自动下一条 = true;
              thisArg.更新消息();
              Game.渲染();
              return true;
            }
          }]
        }];
        Game.渲染();
        return;
      }

      const 老板消息 = {
        内容: "选择要绑定的老板：",
        进入时调用的js函数: (thisArg, cls, msg, idx) => {
          thisArg.__阻止自动下一条 = true;
        },
        按钮: []
      };

      所有老板.forEach(老板 => {
        // 统计该老板已绑定的工人数量
        const 所有工人 = 递归查找所有工人(Game.状态.物品);
        const 已绑定数量 = 所有工人.filter(工人 => 工人.老板编号 === 老板.编号).length;
        
        let 按钮文本 = `老板 ${老板.编号}号`;
        if (已绑定数量 >= 6) {
          按钮文本 += `（已满：${已绑定数量}/6）`;
        } else {
          按钮文本 += `（${已绑定数量}/6）`;
        }

        老板消息.按钮.push({
          显示文本: 按钮文本,
          按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
            // 检查是否已满
            if (已绑定数量 >= 6) {
              Game.消息队列添加("该老板的工人数量已满（最多6人）！", "绑定失败");
              return;
            }
            
            // 绑定工人
            thisArg.工人实例.老板编号 = 老板.编号;
            Game.消息队列添加(`工人已绑定到${老板.编号}号老板。`, "绑定成功");
            
            thisArg.更新消息();
            Game.渲染();
            return true;
          },
          判断是否禁用而被系统频繁调用的js函数: (thisArg, cls, msg, idx, btn) => {
            // 重新计算已绑定数量（仍然按“编号”匹配）
            const 当前所有工人 = 递归查找所有工人(Game.状态.物品);
            const 当前已绑定数量 = 当前所有工人.filter(工人 => 工人.老板编号 === 老板.编号).length;
            return 当前已绑定数量 < 6; // 已满则禁用
          }
        });
      });

      老板消息.按钮.push({
        显示文本: "返回",
        按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
          // 回到工人主界面：重新打开对话以重置idx
          const 工人id = thisArg.工人实例 && thisArg.工人实例.__物品id;
          const 当前工人 = 工人id ? 递归查找所有工人(Game.状态.物品).find(it => it && it.__物品id === 工人id) : thisArg.工人实例;
          if (当前工人) Game.显示对话(new 工人操作对话(当前工人));
          return true;
        }
      });

      this.消息 = [this.消息[0], 老板消息];
      Game.渲染();
    }
  }

  // ==================== 物品类：老板 ====================
  class 老板 {
    static 名字 = "老板";

    constructor(data) {
      this.描述 = "一名老板，可以管理工人并积累财富。";
      this.卖掉的价值 = 100; // 卖出价格固定
      this.能否使用 = true;
      this.编号 = data?.编号 || 0;
      this.钱 = data?.钱 || 0;
    }

    使用后执行的js函数(thisArg, cls) {
      Game.显示对话(new 老板操作对话(thisArg));
      return false;
    }

    显示附加文本所用js函数(thisArg, cls) {
      // 统计当前绑定的工人数量（按“编号”匹配）
      const 所有工人 = 递归查找所有工人(Game.状态.物品);
      const 工人数量 = 所有工人.filter(工人 => 工人.老板编号 === thisArg.编号).length;
      
      return `（老板：${thisArg.编号}号，工人：${工人数量}人，资金：${thisArg.钱}）`;
    }

    // 计钱方法（由市场嘀嗒调用）
    计钱() {
      const 工人数量 = this.计数();
      this.钱 += 工人数量 * 2;
      
      // 确保有唯一ID
      if (!this.__物品id) {
        this.__物品id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
      
      return true;
    }

    // 计数方法（统计绑定的工人数量）
    计数() {
      const 所有工人 = 递归查找所有工人(Game.状态.物品);
      const 工人数量 = 所有工人.filter(工人 => 工人.老板编号 === this.编号).length;
      return 工人数量;
    }
  }

  // ==================== 老板操作对话 ====================
  class 老板操作对话 {
    constructor(老板实例) {
      this.标题 = "老板操作";
      this.老板实例 = 老板实例;
      this.消息 = [];
      this.更新消息();
    }

    更新消息() {
      // 统计当前绑定的工人数量（按“编号”匹配）
      const 所有工人 = 递归查找所有工人(Game.状态.物品);
      const 工人数量 = 所有工人.filter(工人 => 工人.老板编号 === this.老板实例.编号).length;
      
      this.消息 = [{
        内容: `老板 ${this.老板实例.编号}号\n当前资金：${this.老板实例.钱}\n绑定工人：${工人数量}人`,
        按钮: [
          {
            显示文本: "提取资金",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              if (thisArg.老板实例.钱 <= 0) {
                Game.消息队列添加("老板没有资金可以提取。", "提取失败");
                return;
              }
              
              const 提取金额 = thisArg.老板实例.钱;
              Game.状态.钱 += 提取金额;
              thisArg.老板实例.钱 = 0;
              
              Game.消息队列添加(`从老板处提取了${提取金额}元。`, "提取成功");
              thisArg.更新消息();
              Game.渲染();
              return true;
            }
          },
          {
            显示文本: "返回",
            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
              Game.关闭对话();
              return true;
            }
          }
        ]
      }];
    }
  }

  // ==================== 辅助函数 ====================

  // 递归查找所有收纳袋
  function 递归查找所有收纳袋(物品列表) {
    const 结果 = [];
    
    function 遍历(items) {
      if (!Array.isArray(items)) return;
      
      items.forEach(item => {
        if (!item) return;
        
        if (item.constructor && item.constructor.名字 === "收纳袋") {
          结果.push(item);
        }
        
        // 递归查找收纳袋内部的收纳袋
        if (item.constructor && item.constructor.名字 === "收纳袋" && item.内部物品 && Array.isArray(item.内部物品)) {
          遍历(item.内部物品);
        }
      });
    }
    
    遍历(物品列表);
    return 结果;
  }

  // 递归查找所有土地
  function 递归查找所有土地(物品列表) {
    const 结果 = [];
    
    function 遍历(items) {
      if (!Array.isArray(items)) return;
      
      items.forEach(item => {
        if (!item) return;
        
        if (item.constructor && item.constructor.名字 === "土地") {
          结果.push(item);
        }
        
        // 递归查找收纳袋中的土地
        if (item.constructor && item.constructor.名字 === "收纳袋" && item.内部物品 && Array.isArray(item.内部物品)) {
          遍历(item.内部物品);
        }
      });
    }
    
    遍历(物品列表);
    return 结果;
  }

  // 递归查找所有老板
  function 递归查找所有老板(物品列表) {
    const 结果 = [];
    
    function 遍历(items) {
      if (!Array.isArray(items)) return;
      
      items.forEach(item => {
        if (!item) return;
        
        if (item.constructor && item.constructor.名字 === "老板") {
          结果.push(item);
        }
        
        // 递归查找收纳袋中的老板
        if (item.constructor && item.constructor.名字 === "收纳袋" && item.内部物品 && Array.isArray(item.内部物品)) {
          遍历(item.内部物品);
        }
      });
    }
    
    遍历(物品列表);
    return 结果;
  }

  // 递归查找所有工人
  function 递归查找所有工人(物品列表) {
    const 结果 = [];
    
    function 遍历(items) {
      if (!Array.isArray(items)) return;
      
      items.forEach(item => {
        if (!item) return;
        
        if (item.constructor && item.constructor.名字 === "工人") {
          结果.push(item);
        }
        
        // 递归查找收纳袋中的工人
        if (item.constructor && item.constructor.名字 === "收纳袋" && item.内部物品 && Array.isArray(item.内部物品)) {
          遍历(item.内部物品);
        }
      });
    }
    
    遍历(物品列表);
    return 结果;
  }

  // ==================== 市场嘀嗒系统 ====================

  // 市场嘀嗒函数
  function 市场嘀嗒() {
    // 递归查找所有老板
    const 所有老板 = 递归查找所有老板(Game.状态.物品);
    
    if (所有老板.length === 0) return;
    
    所有老板.forEach(老板 => {
      // 确保老板有唯一ID
      if (!老板.__物品id) {
        老板.__物品id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
      
      // 调用老板的计钱方法
      老板.计钱();
    });
    Game.渲染();
  }

  // ==================== 插件初始化 ====================

  // 注册所有类
  Game.注入物品类(猪);
  Game.注入物品类(牛);
  Game.注入物品类(工人);
  Game.注入物品类(老板);
  
  Game.注入商店类(畜力资源商店);
  Game.注入商店类(人力资源商店);
  Game.注入地点类(市场);

  // 为老板生成唯一编号
  let 老板计数器 = 1;
  
  // 修改人力资源商店的数据生成
  const 人力资源商店类 = 人力资源商店;
  人力资源商店类.数据 = [
    {
      物品名: "工人",
      价格: 200,
      物品数据: {
        老板编号: null
      },
      购买时执行的js函数: (cls, 条目) => {
        // 设置工人的初始数据（使用老板编号）
        条目.物品数据 = { 老板编号: null };
        return true;
      },
      显示商店对物品附加文本所用js函数: (cls, 条目) => {
        return "（可以绑定到老板）";
      }
    },
    {
      物品名: "老板",
      价格: 100,
      物品数据: {
        编号: 0,
        钱: 0
      },
      购买时执行的js函数: (cls, 条目) => {
        // 为新老板分配唯一编号
        条目.物品数据.编号 = 老板计数器++;
        条目.物品数据.钱 = 0;
        return true;
      },
      显示商店对物品附加文本所用js函数: (cls, 条目) => {
        return "（可以管理工人）";
      }
    }
  ];

  // 将市场添加到银行的指向地点
  const 银行类 = Game.地点类列表["银行"];
  if (银行类 && 银行类.数据 && 银行类.数据.指向地点) {
    // 检查是否已存在
    const 已存在 = 银行类.数据.指向地点.some(地点 => 地点.地点 === "市场");
    if (!已存在) {
      银行类.数据.指向地点.push({ 地点: "市场", 显示的文本: "前往市场" });
    }
  }


  // 启动市场嘀嗒计时器
  setInterval(() => {
    市场嘀嗒();
  }, 30 * 1000); // 每30秒一次

  // 立即执行一次市场嘀嗒
  setTimeout(() => {
    市场嘀嗒();
  }, 1000);

  Game.消息队列添加("市场扩展插件加载完成！现在可以从银行前往市场了。", "插件加载");
  Game.消息队列添加("市场嘀嗒已启动：每30秒所有老板会自动获得资金（工人数量×2）。", "市场系统");

})();