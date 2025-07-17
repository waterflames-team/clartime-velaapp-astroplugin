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
    }
  ];

  AstroBox.ui.updatePluginSettingsUI(ui)
});

// 数据传输
async function ICSend() {
  courseData = ui[0].content.value.text

  await AstroBox.interconnect.sendQAICMessage(
    "com.waterflames.clartime",
    JSON.stringify({ text: courseData })
  );

}