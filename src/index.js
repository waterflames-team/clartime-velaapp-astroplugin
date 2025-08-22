import AstroBox from "astrobox-plugin-sdk";
import { extractCourseData } from "./extractCourseData.js";
let courseData
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
      node_id: "OriginalDataUpdate",
      visibility: true,
      disabled: false,
      content: {
        type: "Button",
        value: { primary: true, text: "原始数据更新", callback_fun_id: OriginalDataID },
      },
    },
    {
      node_id: "WakeUpDataUpdate",
      visibility: true,
      disabled: false,
      content: {
        type: "Button",
        value: { primary: true, text: "Wakeup数据更新", callback_fun_id: WakeUpDataID },
      },
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
        value: `请在上方输入框里粘贴json格式数据`,
      },
    }
    ,
    {
      node_id: "tip",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `注意：请你先在手环上退出澄序课程表，以保证此插件能与应用正常通信`,
      },
    }
  ];

  AstroBox.ui.updatePluginSettingsUI(ui)
});

function readOriginalData(params) { //原始数据读取
  console.log("pick in")
  console.log(params)
  // 更新输入框的值
  if (params !== undefined) {
    ui[3].content.value.text = params;
    courseData = params;
    AstroBox.ui.updatePluginSettingsUI(ui);
  } else {
    ui[3].content.value.text = "";
    courseData = "";
    ui[7].content.value = "请先填写配置信息";
    AstroBox.ui.updatePluginSettingsUI(ui);
  }
}

async function readWakeUpData(params) { //WakeUp数据读取
  console.log("pick in")
  console.log(params)
  // 更新输入框的值
  if (params !== undefined) {
    courseData = extractCourseData(params);
    // 等一秒
    // await new Promise(resolve => setTimeout(resolve, 1000));
    ui[7].content.value = courseData;
    AstroBox.ui.updatePluginSettingsUI(ui);
  } else {
    ui[1].content.value.text = "";
    courseData = "";
    ui[7].content.value = "请先填写配置信息";
    AstroBox.ui.updatePluginSettingsUI(ui);
  }
}

// 数据传输
async function ICSend() {
  if (!courseData) {
    ui[7].content.value = "请先填写配置信息";
    AstroBox.ui.updatePluginSettingsUI(ui);
    return;
  }

  try {
    const appList = await AstroBox.thirdpartyapp.getThirdPartyAppList()
    const app = appList.find(app => app.package_name == "com.waterflames.clartime")
    if (!app) {
      ui[7].content.value = "请先安装澄序课程表快应用 或 连接设备 或 在手环上重新打开澄序课程表";
      AstroBox.ui.updatePluginSettingsUI(ui);
      return;
    }

    await AstroBox.interconnect.sendQAICMessage(
      "com.waterflames.clartime",
      JSON.stringify(JSON.parse(courseData))
    );
    ui[7].content.value = "发送成功，如果手环上出现数据加载异常/黑屏，\n大概率是数据问题，请自行检查"
    AstroBox.ui.updatePluginSettingsUI(ui)
  } catch (error) {
    console.error(error)
    ui[7].content.value = error
    AstroBox.ui.updatePluginSettingsUI(ui)
  }
}