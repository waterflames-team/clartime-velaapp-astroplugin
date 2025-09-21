import AstroBox from "astrobox-plugin-sdk";
let courseData
let ui
let file

// UI服务启动
let ICSendId = AstroBox.native.regNativeFun(ICSend);
let OriginalDataID = AstroBox.native.regNativeFun(readOriginalData);
let OpenBrowserId = AstroBox.native.regNativeFun(openBrowser); // 注册打开浏览器功能

AstroBox.lifecycle.onLoad(() => {
  ui = [
    {
      node_id: "tip1",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `欢迎使用澄序课程表同步插件，下面我会一步步带你创建并传输你的课程数据。`,
      },
    },
    {
      node_id: "tip2",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `第一步：请你进入下面这个网站生成你的课程数据，支持 Wakeup 以及澄序官方数据格式的导入与编辑。编辑完成后建议保存文件，并复制网站内生成出来的数据。`,
      },
    },
    {
      node_id: "opencte",
      visibility: true,
      disabled: false,
      content: {
        type: "Button",
        value: { primary: true, text: "打开在线课程编辑器", callback_fun_id: OpenBrowserId },
      },
    },
    {
      node_id: "tip3",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `第二步：请你在下方输入框里粘贴你在第一步生成的课程数据。（请确保复制完整，部分手机输入法可能因为字数过长而无法完整粘贴，亲测微信输入法粘贴正常）`,
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
      node_id: "tip4",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `第三步：接下来请你确定 astrobox 是否已经连接手环，随后在手环上关闭并重新打开澄序课程表，进入传输相关页面，以保证此插件能与应用正常通信。当这些都完成以后你就可以点击发送了。`,
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
        value: ``,  
      },
    }
  ];

  AstroBox.ui.updatePluginSettingsUI(ui)
});

function readOriginalData(params) { //原始数据读取
  ui[7].content.value = "";
  AstroBox.ui.updatePluginSettingsUI(ui)
  console.log("原始数据读取 in")
  console.log(params)
  // 更新输入框的值
  try {
    // ui[3].content.value.text = params;
    courseData = params;
    // AstroBox.ui.updatePluginSettingsUI(ui);
    console.log("原始数据非空")
    console.log(courseData)
  } catch (error) {
    console.error(error)
    ui[7].content.value = error
    AstroBox.ui.updatePluginSettingsUI(ui)
  }
}


// 数据传输
async function ICSend() {
  if (courseData === undefined) {
    ui[7].content.value = "配置信息未能读取";
    AstroBox.ui.updatePluginSettingsUI(ui);
    return;
  }

  try {
    const appList = await AstroBox.thirdpartyapp.getThirdPartyAppList()
    const app = appList.find(app => app.package_name == "com.waterflames.clartime")
    if (!app) {
      ui[7].content.value = "请先安装澄序课程表快应用/连接设备";
      AstroBox.ui.updatePluginSettingsUI(ui);
      return;
    }

    try {
      await AstroBox.interconnect.sendQAICMessage(
        "com.waterflames.clartime",
        JSON.stringify(JSON.parse(courseData))
      );
      ui[7].content.value = "发送成功，如果手环上出现数据加载异常/黑屏，大概率是数据问题，请自行检查；如果手环没有任何反应，请检查是否进入相关传输页面（首次进入会在重启后引导你进入相关页面；如果你完成过应用的向导流程，那你可以在设置页找到相关入口）"
      AstroBox.ui.updatePluginSettingsUI(ui)
      return;
    } catch (parseError) {
      console.error("课程数据解析或发送失败:", parseError);
      ui[7].content.value = "发送失败，请检查：1.课程数据是否符合json格式/数据是否完整｜2.连接手环后，传输数据前，是否已经重启应用并进入了相关传输界面";
      AstroBox.ui.updatePluginSettingsUI(ui);
      return;
    }
  
  } catch (error) {
    console.error(error)
    ui[7].content.value = error
    AstroBox.ui.updatePluginSettingsUI(ui)
  }
}

// 修改后的打开浏览器功能 From https://github.com/zaona/simple-weather-astro-plugin/blob/main/src%2Findex.js
function openBrowser() {
  try {
    // 直接打开指定的天气网站，不显示提示
    AstroBox.ui.openPageWithUrl("https://cte.waterflames.cn/");
  } catch (error) {
    console.error("打开浏览器失败:", error);
    // 更新attention
    ui[7].content.value = "打开浏览器失败，请手动前往https://cte.waterflames.cn/";
    AstroBox.ui.updatePluginSettingsUI(ui);
  }
}