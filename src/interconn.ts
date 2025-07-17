/**
 * From @leset0ng
 */

// 导入AstroBox SDK
import AstroBox from "astrobox-plugin-sdk";

/**
 * 基础连接类，提供消息监听和发送功能
 */
export default class interconnect {
    // 存储监听器的Map，key为消息标签，value为回调函数
    listeners = new Map<string, ((data: any) => void)>();
    // 当前插件的包名
    packageName: string;

    /**
     * 构造函数
     * @param packageName 插件包名
     */
    constructor(packageName: string) {
        this.packageName = packageName;
        // 监听来自AstroBox的消息
        AstroBox.event.addEventListener<string>(`onQAICMessage_${packageName}`, (data) => {
            // 解析消息内容
            const { tag, ...payload } = JSON.parse(data);
            // 调用对应的监听器
            this.listeners.get(tag)?.(payload);
        })
    }
    /**
     * 添加消息监听器
     * @param tag 消息标签
     * @param callback 回调函数
     */
    addListener<T>(tag: string, callback: (data: T) => void) {
        this.listeners.set(tag, callback);
    }

    /**
     * 移除消息监听器
     * @param tag 消息标签
     */
    removeListener(tag: string) {
        this.listeners.delete(tag);
    }

    /**
     * 发送消息
     * @param tag 消息标签
     * @param data 消息内容
     * @returns Promise<void>
     */
    send<T>(tag: string, data: T) {
        return AstroBox.interconnect.sendQAICMessage(this.packageName,JSON.stringify({tag,...data}))
    }
}