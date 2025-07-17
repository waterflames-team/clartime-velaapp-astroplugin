import AstroBox from "astrobox-plugin-sdk";
let courseData
let ui

// UI服务启动
let ICSendId = AstroBox.native.regNativeFun(ICSend);

AstroBox.lifecycle.onLoad(() => {
  ui = [
    {
      node_id: "pickFile",
      visibility: true,
      disabled: false,
      content: {
        type: "Input",
        value: {
          text: "你好",
          callback_fun_id: ICSendId
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
      node_id: "send",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `请你在手环上退出澄序课程表，以保证此插件能与应用正常通信`,
      },
    }
  ];

  AstroBox.ui.updatePluginSettingsUI(ui)
});

// 数据传输
async function ICSend() {
  try {
      const appList = await AstroBox.thirdpartyapp.getThirdPartyAppList()
      const app = appList.find(app=>app.package_name=="com.waterflames.clartime")
      if (!app) {
        ui[2].content.value = "请先安装澄序课程表快应用";
        AstroBox.ui.updatePluginSettingsUI(ui);
      }
      await AstroBox.thirdpartyapp.launchQA(app, "com.waterflames.clartime")
      await new Promise(resolve => setTimeout(resolve, 1000))

      courseData = ui[0].content.value.text
      await AstroBox.interconnect.sendQAICMessage(
        "com.waterflames.clartime",
        JSON.stringify({ text: courseData })
      );
      ui[2].content.value = "发送成功"
      AstroBox.ui.updatePluginSettingsUI(ui)
  } catch (error) {
      console.error(error)
      ui[2].content.value = error.message
      AstroBox.ui.updatePluginSettingsUI(ui)
  }
}