import AstroBox from "astrobox-plugin-sdk";
import extractCourseData from "./extractCourseData.js";
let courseData
let excourseData
let ui
let file

// UI服务启动
let ICSendId = AstroBox.native.regNativeFun(ICSend);
let OriginalDataID = AstroBox.native.regNativeFun(readOriginalData);
let WakeUpDataID = AstroBox.native.regNativeFun(readWakeUpData);

AstroBox.lifecycle.onLoad(() => {
  ui = [
    {
      node_id: "title1",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `WakeUp课程数据：`,
      },
    },
    {
      node_id: "WakeUpData",
      visibility: true,
      disabled: false,
      content: {
        type: "Input",
        value: {
          text: "",
          callback_fun_id: WakeUpDataID,
        }
      }
    },
    {
      node_id: "title1",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `原始课程数据：`,
      },
    },
    {
      node_id: "OriginalData",
      visibility: true,
      disabled: false,
      content: {
        type: "Input",
        value: {
          text: "",
          callback_fun_id: OriginalDataID,
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
      node_id: "attention",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `请在上方输入框里粘贴json格式数据，然后点击空白处，耐心等待解析完成，过程中不要做其他操作，完成后此处会有提示`,  
        style: {
          color: "red",
        },
      },
    }
    ,
    {
      node_id: "tip",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `注意：1.请你先在手环上退出并重新打开澄序课程表，以保证此插件能与应用正常通信\n2.WakeUp 数据解析有概率发生乱序，在导入后请检查课程信息是否一致，如不一致请尝试重新导入\n3.在填写完数据后不要点击另一个输入框，会导致数据绑定错误`,
      },
    }
  ];

  AstroBox.ui.updatePluginSettingsUI(ui)
});

function readOriginalData(params) { //原始数据读取
  console.log("原始数据读取 in")
  console.log(params)
  // 更新输入框的值
  try {
    // ui[3].content.value.text = params;
    courseData = JSON.parse(params);

    // AstroBox.ui.updatePluginSettingsUI(ui);
    console.log("原始数据非空")
    console.log(courseData)
    ui[5].content.value = " 原始数据读取完成，可以点击发送了";
    AstroBox.ui.updatePluginSettingsUI(ui);
  } catch (error) {
    console.error(error)
    ui[5].content.value = error
    AstroBox.ui.updatePluginSettingsUI(ui)
  }
}

function readWakeUpData(params) { //WakeUp数据读取
  ui[5].content.value = "WakeUp数据解析中，请稍后，过程中请不要进行任何操作";
  AstroBox.ui.updatePluginSettingsUI(ui);
  console.log("WakeUp数据读取 in")
  console.log(params)
  // 更新输入框的值
  try {
    
    excourseData = extractCourseData(params);
    // 等一秒
    //
    // ui[3].content.value = excourseData;
    console.log("WakeUp数据非空,转换结果")
    console.log(excourseData)
    courseData = excourseData;
    ui[5].content.value = "WakeUp数据解析完成，可以点击发送了";
    AstroBox.ui.updatePluginSettingsUI(ui);
    // AstroBox.ui.updatePluginSettingsUI(ui);
  } catch (error) {
    console.error(error)
    ui[5].content.value = error
    AstroBox.ui.updatePluginSettingsUI(ui)
  }
}

// 数据传输
async function ICSend() {
  if (courseData === undefined) {
    ui[5].content.value = "配置信息未能读取";
    AstroBox.ui.updatePluginSettingsUI(ui);
    return;
  }

  try {
    const appList = await AstroBox.thirdpartyapp.getThirdPartyAppList()
    const app = appList.find(app => app.package_name == "com.waterflames.clartime")
    if (!app) {
      ui[5].content.value = "请先安装澄序课程表快应用 或 连接设备 或 在手环上重新打开澄序课程表";
      AstroBox.ui.updatePluginSettingsUI(ui);
      return;
    }

    await AstroBox.interconnect.sendQAICMessage(
      "com.waterflames.clartime",
      JSON.stringify(courseData)
    );
    ui[5].content.value = "发送成功，如果手环上出现数据加载异常/黑屏，大概率是数据问题，请自行检查；如果手环没有任何反应，请检查是否进入相关传输页面（首次进入会在重启后引导你进入相关页面；如果你完成过应用的向导流程，那你可以在设置页找到相关入口）"
    AstroBox.ui.updatePluginSettingsUI(ui)
  } catch (error) {
    console.error(error)
    ui[5].content.value = error
    AstroBox.ui.updatePluginSettingsUI(ui)
  }
}