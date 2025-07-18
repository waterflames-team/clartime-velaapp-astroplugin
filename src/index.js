import AstroBox from "astrobox-plugin-sdk";
let courseData
let ui
let file

// UI服务启动
let ICSendId = AstroBox.native.regNativeFun(ICSend);
let PickId = AstroBox.native.regNativeFun(onPick);

AstroBox.lifecycle.onLoad(() => {
  ui = [
    {
      node_id: "pickFile",
      visibility: true,
      disabled: false,
      content: {
        type: "Button",
        value: {
          primary: true,
          text: "选择配置文件",
          callback_fun_id: PickId
        }
      }
    },
    {
      node_id: "send",
      visibility: true,
      disabled: true,
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
        value: `未选择文件`,
      },
    }
    ,
    {
      node_id: "tip",
      visibility: true,
      disabled: false,
      content: {
        type: "Text",
        value: `注意：请你在手环上退出澄序课程表，以保证此插件能与应用正常通信`,
      },
    }
  ];

  AstroBox.ui.updatePluginSettingsUI(ui)
});

/**
 * 从文件路径中提取文件名
 * @param {string} filePath - 文件路径
 * @returns {string} 文件名
 */
export function getFileName(filePath) {
  if (!filePath) return '';
  // 统一路径分隔符并获取最后一部分
  return filePath.replace(/\\/g, '/').split('/').pop() || '';
}

// 文件选择
async function onPick() {
  try {
    file = await AstroBox.filesystem.pickFile({
      decode_text: true,
    })
    console.log("file",file)
  } catch (error) {
    console.error(error)
    ui[2].content.value = error.message
    AstroBox.ui.updatePluginSettingsUI(ui)
  }
  console.log("goon1")
  console.log("file.path",file.path)

  if (!file.path.endsWith(".json")) {
    ui[2].content.value = "请选择.json文件";
    AstroBox.ui.updatePluginSettingsUI(ui);
    return;
  }
  console.log("goon2")

  courseData = await AstroBox.filesystem.readFile(file.path, {
    len: file.text_len,
    decode_text: true
  });
  console.log("courseData",courseData)
  ui[2].content.value = `已选择文件 ${getFileName(file.path)}, 请在手环上重新打开澄序课程表，进入数据接收状态`
  ui[1].disabled = false
  AstroBox.ui.updatePluginSettingsUI(ui)
}

// 数据传输
async function ICSend() {
  console.log("通了吗2",courseData)

  if (!courseData) {
    ui[2].content.value = "请先加载配置";
    AstroBox.ui.updatePluginSettingsUI(ui);
    return;
  }

  const data = await courseData; // 获取Promise的实际值
  await AstroBox.interconnect.sendQAICMessage(
    "com.waterflames.clartime",
    JSON.stringify(data)
  );
  console.log("通了吗3",courseData)

  try {
    console.log("开 try 了吗",courseData)
    await AstroBox.interconnect.sendQAICMessage(
      "com.waterflames.clartime",
      JSON.stringify(courseData)
    );
    console.log("try完了吗",courseData)
    ui[2].content.value = "发送成功"
    AstroBox.ui.updatePluginSettingsUI(ui)
  } catch (error) {
    console.error(error)
    ui[2].content.value = error.message
    AstroBox.ui.updatePluginSettingsUI(ui)
  }
}