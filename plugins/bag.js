// 收纳袋插件（修正版 - 修复连续操作界面消失问题）
(function () {
    "use strict";

    class 收纳袋 {
        static 名字 = "收纳袋";

        constructor(data) {
            this.描述 = "一个神奇的袋子，可以存放最多64个物品。";
            this.卖掉的价值 = 10;
            this.能否使用 = true;

            // 初始化内部存储
            this.内部物品 = data?.内部物品 || [];
            this.容量 = 64;

            // 确保每个物品都有唯一的ID（为了在对话中精确识别）
            this.内部物品.forEach((item, index) => {
                if (!item.__收纳袋id) {
                    item.__收纳袋id = Date.now() + '-' + index + '-' + Math.random().toString(36).substr(2, 9);
                }
            });
        }

        使用后执行的js函数(thisArg, cls) {
            // 显示操作选择对话
            Game.显示对话(new 收纳袋操作对话(thisArg));
            return false; // 不自动消耗
        }

        显示附加文本所用js函数(thisArg, cls) {
            // 动态拼接前6个物品的名字
            if (!thisArg.内部物品 || thisArg.内部物品.length === 0) {
                return "（空）";
            }

            const 前6个物品 = thisArg.内部物品.slice(0, 6);
            const 名字列表 = 前6个物品.map(item => {
                // 获取物品的基本名字（不包括附加文本）
                if (item && item.constructor) {
                    return item.constructor.名字 || "未知物品";
                }
                return "未知物品";
            });

            let 显示文本 = 名字列表.join('，');
            if (thisArg.内部物品.length > 6) {
                显示文本 += `...等${thisArg.内部物品.length}个物品`;
            } else {
                显示文本 += `（共${thisArg.内部物品.length}个）`;
            }

            return `（${显示文本}）`;
        }

        卖掉时执行的js函数(thisArg, cls) {
            // 卖掉前将内部物品全部倾泻到背包
            if (thisArg.内部物品 && thisArg.内部物品.length > 0) {
                const 倾泻数量 = thisArg.内部物品.length;

                // 将内部物品添加到背包
                thisArg.内部物品.forEach(item => {
                    // 移除内部ID标记
                    if (item.__收纳袋id) {
                        delete item.__收纳袋id;
                    }
                    Game.状态.物品.push(item);
                });

                Game.消息队列添加(`收纳袋被卖掉，${倾泻数量}个物品被倾泻到背包中。`, "收纳袋清空");

                // 清空内部物品
                thisArg.内部物品 = [];
            }

            return true;
        }

        不持有到持有时执行的js函数(thisArg, cls, shopCls) {
            Game.消息队列添加("获得物品：收纳袋", "获得");
        }

        持有到不持有时执行的js函数(thisArg, cls) {
            // 不需要特殊处理
            return true;
        }

        // 辅助方法：检查是否可以放入物品
        是否可以放入物品(thisArg, 物品实例) {
            // 不能放入自己（这个特定的收纳袋实例）
            if (物品实例 === thisArg) {
                return false;
            }

            // 检查容量
            if (thisArg.内部物品.length >= thisArg.容量) {
                return false;
            }

            return true;
        }

        // 辅助方法：放入物品
        放入物品(thisArg, 物品实例) {
            if (!thisArg.是否可以放入物品(thisArg, 物品实例)) {
                return false;
            }

            // 给物品添加唯一ID
            if (!物品实例.__收纳袋id) {
                物品实例.__收纳袋id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            }

            // 从背包中移除
            const 背包索引 = Game.状态.物品.indexOf(物品实例);
            if (背包索引 >= 0) {
                Game.状态.物品.splice(背包索引, 1);
            }

            // 添加到内部存储
            thisArg.内部物品.push(物品实例);

            // 检查是否刚刚变满
            if (thisArg.内部物品.length === thisArg.容量) {
                Game.消息队列添加("收纳袋已经装满了64个物品！", "收纳袋满了");
            }

            return true;
        }

        // 辅助方法：拿出物品
        拿出物品(thisArg, 物品实例) {
            const 内部索引 = thisArg.内部物品.findIndex(item =>
                item.__收纳袋id === 物品实例.__收纳袋id
            );

            if (内部索引 >= 0) {
                // 从内部存储移除
                const 拿出的物品 = thisArg.内部物品.splice(内部索引, 1)[0];

                // 移除内部ID标记
                if (拿出的物品.__收纳袋id) {
                    delete 拿出的物品.__收纳袋id;
                }

                // 添加到背包
                Game.状态.物品.push(拿出的物品);
                return true;
            }

            return false;
        }
    }

    // 收纳袋操作对话
    class 收纳袋操作对话 {
        constructor(收纳袋实例) {
            this.标题 = "收纳袋操作";
            this.收纳袋 = 收纳袋实例;

            this.消息 = [
                {
                    内容: `收纳袋操作（当前：${收纳袋实例.内部物品.length}/${收纳袋实例.容量}）`,
                    按钮: [
                        {
                            显示文本: "拿出物品",
                            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                                thisArg.创建拿出物品消息();
                                return true;
                            }
                        },
                        {
                            显示文本: "放入物品",
                            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                                thisArg.创建放入物品消息();
                                return true;
                            }
                        }
                    ]
                }
            ];

            // 记录当前操作状态
            this.当前操作 = "主菜单";
        }

        创建拿出物品消息() {
            const 收纳袋 = this.收纳袋;

            if (收纳袋.内部物品.length === 0) {
                const 空消息 = {
                    内容: "收纳袋是空的，没有物品可以拿出。",
                    进入时调用的js函数(thisArg, cls, msg, idx) {
                        thisArg.__阻止自动下一条 = true;
                    },
                    按钮: [
                        {
                            显示文本: "返回",
                            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                                thisArg.__阻止自动下一条 = false;
                                thisArg.当前操作 = "主菜单";
                                thisArg.重建主菜单();
                                Game.渲染();
                            }
                        }
                    ]
                };

                this.当前操作 = "拿出物品";
                this.消息 = [this.消息[0], 空消息];
                Game.渲染();
                return;
            }

            const 拿出消息 = {
                内容: `选择要拿出的物品（${收纳袋.内部物品.length}/${收纳袋.容量}）：`,
                进入时调用的js函数(thisArg, cls, msg, idx) {
                    thisArg.__阻止自动下一条 = true;
                },
                按钮: []
            };

            // 为每个内部物品创建按钮
            收纳袋.内部物品.forEach((item, index) => {
                const 物品id = item.__收纳袋id; // 保存物品的ID

                拿出消息.按钮.push({
                    显示文本: this.获取物品显示文本(item),
                    按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                        // 通过ID找到当前物品
                        const 当前物品 = 收纳袋.内部物品.find(it => it.__收纳袋id === 物品id);
                        if (!当前物品) {
                            Game.消息队列添加("物品已不存在！", "错误");
                            return;
                        }

                        const 物品名字 = 当前物品.constructor.名字 || "未知物品";
                        const 成功 = 收纳袋.拿出物品(收纳袋, 当前物品);

                        if (成功) {
                            Game.消息队列添加(`从收纳袋中拿出了${物品名字}。`, "收纳袋操作");

                            // 如果还有物品，重新创建拿出界面
                            if (收纳袋.内部物品.length > 0) {
                                thisArg.创建拿出物品消息();
                            } else {
                                // 没有物品了，返回主菜单
                                thisArg.当前操作 = "主菜单";
                                thisArg.重建主菜单();
                                Game.渲染();
                            }
                        }
                    }
                });
            });

            // 添加返回按钮
            拿出消息.按钮.push({
                显示文本: "返回",
                按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                    thisArg.__阻止自动下一条 = false;
                    thisArg.当前操作 = "主菜单";
                    thisArg.重建主菜单();
                    Game.渲染();
                }
            });

            this.当前操作 = "拿出物品";
            this.消息 = [this.消息[0], 拿出消息];
            Game.渲染();
        }

        创建放入物品消息() {
            const 收纳袋 = this.收纳袋;
            const 背包物品 = Game.状态.物品.filter(item => item !== 收纳袋);

            if (背包物品.length === 0) {
                const 空背包消息 = {
                    内容: "背包中没有其他物品可以放入。",
                    进入时调用的js函数(thisArg, cls, msg, idx) {
                        thisArg.__阻止自动下一条 = true;
                    },
                    按钮: [
                        {
                            显示文本: "返回",
                            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                                thisArg.__阻止自动下一条 = false;
                                thisArg.当前操作 = "主菜单";
                                thisArg.重建主菜单();
                                Game.渲染();
                            }
                        }
                    ]
                };

                this.当前操作 = "放入物品";
                this.消息 = [this.消息[0], 空背包消息];
                Game.渲染();
                return;
            }

            const 放入消息 = {
                内容: `选择要放入的物品（${收纳袋.内部物品.length}/${收纳袋.容量}）：`,
                进入时调用的js函数(thisArg, cls, msg, idx) {
                    thisArg.__阻止自动下一条 = true;
                },
                按钮: []
            };

            const 已满 = 收纳袋.内部物品.length >= 收纳袋.容量;

            if (已满) {
                放入消息.内容 = `收纳袋已满（${收纳袋.容量}/${收纳袋.容量}），无法放入更多物品。`;
            }

            // 为每个背包物品创建按钮
            背包物品.forEach((item, index) => {
                const 物品id = item.__收纳袋id || (item.__收纳袋id = Date.now() + '-' + index + '-' + Math.random().toString(36).substr(2, 9));

                const 按钮 = {
                    显示文本: this.获取物品显示文本(item),
                    按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                        // 重新获取当前物品
                        const 当前物品 = Game.状态.物品.find(it => it.__收纳袋id === 物品id);
                        if (!当前物品) {
                            Game.消息队列添加("物品已不存在！", "错误");
                            return;
                        }

                        const 物品名字 = 当前物品.constructor.名字 || "未知物品";
                        const 成功 = 收纳袋.放入物品(收纳袋, 当前物品);

                        if (成功) {
                            Game.消息队列添加(`将${物品名字}放入了收纳袋。`, "收纳袋操作");

                            // 重新获取背包物品
                            const 新的背包物品 = Game.状态.物品.filter(item => item !== 收纳袋);

                            // 如果背包还有物品且收纳袋未满，重新创建放入界面
                            if (新的背包物品.length > 0 && 收纳袋.内部物品.length < 收纳袋.容量) {
                                thisArg.创建放入物品消息();
                            } else {
                                // 背包空了或收纳袋满了，返回主菜单
                                thisArg.当前操作 = "主菜单";
                                thisArg.重建主菜单();
                                Game.渲染();
                            }
                        }
                    }
                };

                if (已满) {
                    按钮.禁用 = true;
                }

                放入消息.按钮.push(按钮);
            });

            // 添加返回按钮
            放入消息.按钮.push({
                显示文本: "返回",
                按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                    thisArg.__阻止自动下一条 = false;
                    thisArg.当前操作 = "主菜单";
                    thisArg.重建主菜单();
                    Game.渲染();
                }
            });

            this.当前操作 = "放入物品";
            this.消息 = [this.消息[0], 放入消息];
            Game.渲染();
        }

        // 重建主菜单消息
        重建主菜单() {
            const 收纳袋 = this.收纳袋;

            this.消息 = [
                {
                    内容: `收纳袋操作（当前：${收纳袋.内部物品.length}/${收纳袋.容量}）`,
                    按钮: [
                        {
                            显示文本: "拿出物品",
                            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                                thisArg.创建拿出物品消息();
                                return true;
                            }
                        },
                        {
                            显示文本: "放入物品",
                            按下调用的js函数: (thisArg, cls, msg, idx, btn) => {
                                thisArg.创建放入物品消息();
                                return true;
                            }
                        }
                    ]
                }
            ];
        }

        // 辅助方法：获取物品显示文本
        获取物品显示文本(item) {
            const 物品名字 = item.constructor.名字 || "未知物品";
            let 附加文本 = "";

            if (typeof item.显示附加文本所用js函数 === "function") {
                const 文本结果 = item.显示附加文本所用js函数(item, item.constructor);
                if (文本结果) {
                    附加文本 = 文本结果;
                }
            }

            return 物品名字 + 附加文本;
        }
    }

    // 注入物品类
    Game.注入物品类(收纳袋);

    // 添加到起点商店
    const 起点类 = Game.地点类列表["起点"];
    if (起点类 && 起点类.数据 && 起点类.数据.商店) {
        const 杂货店类 = Game.商店类列表["杂货店"];
        if (杂货店类 && 杂货店类.数据) {
            // 检查是否已存在收纳袋
            const 已存在 = 杂货店类.数据.some(商品 => 商品.物品名 === "收纳袋");
            if (!已存在) {
                杂货店类.数据.push({
                    物品名: "收纳袋",
                    价格: 13,
                    物品数据: () => ({
                        内部物品: []
                    }),
                    显示商店对物品附加文本所用js函数: (cls, 条目) => {
                        return "（可以放64个物品）";
                    }
                });

                Game.消息队列添加("收纳袋已添加到杂货店，售价13元。", "插件加载");
            }
        } else {
            class 收纳袋商店 {
                static 名字 = "收纳袋商店";
                static 显示的文本 = "这里出售神奇的收纳袋。";
                static 数据 = [
                    {
                        物品名: "收纳袋",
                        价格: 13,
                        物品数据: () => ({
                            内部物品: []
                        }),
                        显示商店对物品附加文本所用js函数: (cls, 条目) => {
                            return "（可以放64个物品）";
                        }
                    }
                ];
            }

            Game.注入商店类(收纳袋商店);
            起点类.数据.商店.push("收纳袋商店");
            Game.消息队列添加("收纳袋商店已创建并添加到起点。", "插件加载");
        }
    }

    Game.消息队列添加("收纳袋插件加载完成！可以购买和使用收纳袋来管理物品。", "插件加载");
})();