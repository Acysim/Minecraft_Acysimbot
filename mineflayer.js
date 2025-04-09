const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { GoalNear } = require('mineflayer-pathfinder').goals
const collectBlock = require('mineflayer-collectblock').plugin

const bot = mineflayer.createBot({
  host: '117.21.200.32',
  port: 25565,
  username: 'AcysimBot',
})

// 加载插件
bot.loadPlugin(pathfinder)
bot.loadPlugin(collectBlock)

bot.on('spawn', () => {
    bot.chat('我已重生')
    bot.chat('早上好！Master')

    // 在spawn事件中初始化mcData和移动设置
    const mcData = require('minecraft-data')(bot.version)
    const defaultMovements = new Movements(bot, mcData)
    defaultMovements.allowSprinting = true
    bot.pathfinder.setMovements(defaultMovements)

    // 监听聊天指令
    bot.on('chat', (username, message) => {
        if (username === bot.username) return

        // 检测砍树命令
        if (message === '砍树') {
            bot.chat('开始寻找并砍伐附近的树木')
            chopTrees().catch(err => {
                bot.chat(`砍树出错: 有司马的玩意在挡我，滚开草拟吗，尼玛是不是思乐，你个酬宾！`)
                console.error(err)
            })
        }

        async function chopTrees() {
            // 定义树木类型
            const treeTypes = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log']
            const treeBlocks = []

            // 遍历所有可能的树木类型
            for (const treeType of treeTypes) {
                const treeBlock = mcData.blocksByName[treeType]
                if (treeBlock) {
                    const trees = bot.findBlocks({
                        matching: treeBlock.id,
                        maxDistance: 64,
                        count: 64,
                    })

                    for (const treebeg of trees) {
                        treeBlocks.push(bot.blockAt(treebeg))
                    }
                }
            }


    // 分批处理树木
            const batchSize = 5; // 每批处理5棵树
            for (let i = 0; i < treeBlocks.length; i += batchSize) {
                const batch = treeBlocks.slice(i, i + batchSize);
                bot.chat(`开始处理第${i/batchSize+1}批树木，共${batch.length}棵`);

                try {
                    await bot.collectBlock.collect(batch);
                } catch (err) {
                    bot.chat(`这批树处理失败: ${err.message}`);
                    // 继续下一批
                }
            }




            if (treeBlocks.length === 0) {
                bot.chat('你老母的，附近哪里有树，砍你妈酬宾')
                return
            }

            bot.chat(`草拟吗，终于找到了${treeBlocks.length}颗树，累死你爹了，你爹要开始砍树咯！`)

            const chopPromise = bot.collectBlock.collect(treeBlocks)
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve('丢你老母的，砍树超时了')
                }, 60000) // 60秒超时
            })

            await Promise.race([chopPromise, timeoutPromise])
            bot.chat('司马资本家砍完树了，收工！')
        }
    })
})