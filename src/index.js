import AstroBox from "astrobox-plugin-sdk";
import Interconn from './interconn.ts';

let AppInterconn
let courseData

// UI服务启动
const DataGetID = AstroBox.native.regNativeFun(DataGet);
const ICSendId = AstroBox.native.regNativeFun(ICSend);


AstroBox.lifecycle.onLoad(() => {
  AppInterconn = new Interconn("com.waterflames.clartime");
  const ui = [
    {
      node_id: "pickFile",
      visibility: true,
      disabled: false,
      content: {
        type: "Input",
        value: {
          text: "输入数据",
          callback_fun_id: DataGetID
        }
      }
    },
    {
      node_id: "send",
      visibility: true,
      disabled: false,
      content: {
        type: "Button",
        value: { primary: true, text: "发送", callback_fun_id: ICSendId },
      },
    },
    {
      node_id: "Info",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `等待中`
      }
    },
  ];

  AstroBox.ui.updatePluginSettingsUI(ui)
});




function DataGet(data) {
  courseData = data;
}

// 数据获取
/**
 * 获取文件数据
 * @returns {Promise<{pickRet: any, data: any}>} 返回文件选择结果和文件内容喵～
 */
// async function DataGet() {
//   try {
//     // 1. 让用户选择文件
//     const pickRet = await AstroBox.filesystem.pickFile();
    
//     // 2. 读取文件内容
//     const data = await AstroBox.filesystem.readFile(pickRet.path);

//     return data;
//   } catch (error) {
//     // 错误处理
//     throw error;
//   }
// }

// // 获取文件数据
// const courseData = DataGet();

// 数据传输
async function ICSend() {

  await AstroBox.interconnect.sendQAICMessage(
    "com.waterflames.clartime",
    JSON.stringify({ cmd: "ping" })
  );

  // AstroBox.ui.updatePluginSettingsUI(ui)
  // try {
  //   const appList = await AstroBox.thirdpartyapp.getThirdPartyAppList()
  //   const app = appList.find(app => app.package_name == "com.waterflames.clartime")
  //   if (!app) {
  //     ui[2].content.value = "请先澄序课程表快应用"
  //     //@ts-ignore
  //     return AstroBox.ui.updatePluginSettingsUI(ui)
  //   }
  //   await AstroBox.thirdpartyapp.launchQA(app, "com.waterflames.clartime")
  //   await new Promise(resolve => setTimeout(resolve, 1000))
  //   if (AppInterconn) {
  //     AppInterconn.send("CourseData", courseData);
  //   } else {
  //     console.error("AppInterconn 为 null，无法发送数据");
  //     ui[2].content.value = "连接未初始化，无法发送数据";
  //     //@ts-ignore
  //     AstroBox.ui.updatePluginSettingsUI(ui);
  //   }
    
  // } catch (error) {
  //   console.error(error)
  //   //@ts-ignore
  //   ui[2].content.value = error.message
  //   //@ts-ignore
  //   AstroBox.ui.updatePluginSettingsUI(ui)
  // }
}