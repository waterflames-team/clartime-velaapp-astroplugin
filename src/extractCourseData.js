/**
 * 提取课表文件中的信息并生成JSON文件
 * 功能：读取指定课表文件，提取课程表基本数据和课程列表
 * 使用数组逻辑而非正则表达式提取数据
 */

/**
 * 格式化日期为yyMMdd格式
 * @param {string} dateStr - 输入日期字符串，格式如"2025-9-1"
 * @returns {string} 格式化后的日期字符串，如"250901"
 */
function formatDate(dateStr) {
  const parts = dateStr.split('-');
  const year = parts[0].slice(2); // 取年份后两位
  const month = parts[1].padStart(2, '0'); // 月份补零
  const day = parts[2].padStart(2, '0'); // 日期补零
  return `${year}${month}${day}`;
}

/**
 * 计算日期加上指定周数后的日期
 * @param {string} dateStr - 输入日期字符串，格式如"2025-9-1"
 * @param {number} weeks - 要添加的周数
 * @returns {string} 计算后的日期字符串，格式如"251103"
 */
function addWeeksToDate(dateStr, weeks) {
  const parts = dateStr.split('-');
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + weeks * 7);
  
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}${month}${day}`;
}

/**
 * 主函数
 * @param {string} fileContentInput - 源文件内容
 * @returns {object} 提取后的课程数据对象
 */
function extractCourseData(fileContentInput) {
  try {
    // 读取源文件内容
    const fileContent = fileContentInput
    
    // 使用正则表达式分割多部分JSON
    let data = {};
    let courseDetailsArray = [];  // 存储id、room、teacher信息
    let coursesInfoArray = [];    // 存储id、courseName信息
    let tableNameFound = false;
    
    try {
      // 使用正则表达式分割文件内容为多个JSON部分
      // 这个正则表达式匹配JSON对象或数组之间的边界
      const jsonParts = fileContent.split(/\s*(?<=[}\]])\s*(?=[{\[]|$)\s*/g);
      
      // 处理每个JSON部分
      for (const part of jsonParts) {
        if (!part.trim()) continue; // 跳过空部分
        
        try {
          // 尝试解析为JSON对象
          const json = JSON.parse(part);
          
          if (typeof json === 'object' && json !== null) {
            if (json.tableName) {
              // 找到包含tableName的对象
              data = json;
              tableNameFound = true;
            } else if (Array.isArray(json)) {
              // 处理数组
              if (json.some(item => item.courseName)) {
                // 包含courseName的数组
                coursesInfoArray = json;
              } else if (json.some(item => item.teacher && item.room)) {
                // 包含teacher和room的数组
                courseDetailsArray = json;
              }
            }
          }
        } catch (e) {
          // 忽略解析错误，继续处理下一个部分
        }
      }
      
      if (!tableNameFound) {
        throw new Error('未找到包含tableName的对象');
      }
    } catch (parseError) {
      console.error('解析文件失败:', parseError);
      return;
    }
    
    // 提取基本信息
    const tableName = data.tableName || '';
    const startDate = data.startDate || '';
    const maxWeek = data.maxWeek || 0;
    const nodes = data.nodes || 0;  // 获取nodes值

    // 提取时间数据数组 (包含startTime和endTime的数组)
    let timeDataArray = [];
    try {
      const jsonParts = fileContent.split(/\s*(?<=[}\]])\s*(?=[{\[]|$)\s*/g);
      for (const part of jsonParts) {
        if (!part.trim()) continue;
        try {
          const json = JSON.parse(part);
          if (Array.isArray(json) && json.some(item => item.startTime && item.endTime)) {
            timeDataArray = json;
			console.log('提取到的时间数据:', timeDataArray);

            break;
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    } catch (e) {
      console.error('提取时间数据失败:', e);
    }
    
    // 创建课程信息映射 (id -> courseName)
    const courseNameMap = new Map();
    coursesInfoArray.forEach(course => {
      if (course.id !== undefined && course.courseName) {
        courseNameMap.set(course.id, course.courseName);
      }
    });
    
    // 合并课程详细信息和课程名称
    let courses = courseDetailsArray
      .map(detail => {
        // 首先尝试通过ID匹配课程名称
        let courseName = courseNameMap.get(detail.id) || '';
        
        // 如果通过ID没有找到课程名称，尝试通过detail.courseName匹配
        if (!courseName && detail.courseName) {
          courseName = detail.courseName;
        }
        
        // 如果仍然没有课程名称，则跳过该课程
        if (!courseName) {
          return null;
        }
        
        return {
          courseName: courseName,
          teacher: detail.teacher || '',
          classroom: detail.room || ''
        };
      })
      .filter(course => course !== null && course.courseName && course.courseName.trim() !== '');  // 只保留有课程名称且非空的条目
    
    // 处理教室和教师信息，如果为空则设置为''
    courses = courses.map(course => {
      return {
        ...course,
        classroom: course.classroom || '',
        teacher: course.teacher || ''
      };
    });
    
    // 去重（当courseName、teacher和classroom均相同时才去重）
    const uniqueCourses = [];
    const seenCourseIdentifiers = new Set();
    courses.forEach(course => {
      // 创建课程唯一标识（组合courseName、teacher和classroom）
      const courseIdentifier = `${course.courseName}_${course.teacher}_${course.classroom}`;
      if (!seenCourseIdentifiers.has(courseIdentifier)) {
        seenCourseIdentifiers.add(courseIdentifier);
        uniqueCourses.push(course);
      }
    });
    courses = uniqueCourses;
	console.log('去重后的课程数据:', courses);

    
    
    if (tableName && startDate && maxWeek) {
      // 格式化日期
      const courseStart = formatDate(startDate);
      
      // 计算结束日期
      const courseEnd = addWeeksToDate(startDate, maxWeek);
      
      // 生成timetableTemplate数组，为每个不同的day生成一个timetableTemplate
      let timetableTemplates = [];
      let courseSchedule = [];
      
      // 提取课程安排数据
      let courseScheduleArray = [];
      try {
        const jsonParts = fileContent.split(/\s*(?<=[}\]])\s*(?=[{\[]|$)\s*/g);
        for (const part of jsonParts) {
          if (!part.trim()) continue;
          try {
            const json = JSON.parse(part);
            // 查找包含课程安排信息的数组（根据day字段判断）
            if (Array.isArray(json) && json.some(item => item.day !== undefined && item.startNode !== undefined)) {
              courseScheduleArray = json;
              break;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      } catch (e) {
        console.error('提取课程安排数据失败:', e);
      }
      
      // 获取所有不同的day值，包括1-7天
      const allDays = [1, 2, 3, 4, 5, 6, 7];
      const uniqueDays = [...new Set(courseScheduleArray.map(item => item.day))].sort((a, b) => a - b);
      
      // 用于存储模板和其索引的映射
      const templateMap = new Map();
      // 存储每个day对应的模板索引
      const dayTemplateIndexMap = new Map();
      
      // 为每个day生成timetableTemplate
      uniqueDays.forEach(day => {
        const dayTemplate = [{ type: 'start' }];
        
        // 获取该day的所有课程安排
        const dayCourses = courseScheduleArray.filter(item => item.day === day);
        
        // 收集所有时间节点（包括course和interval）
        const timeNodes = [];
        
        // 为每个课程安排生成时间节点
        dayCourses.forEach(course => {
          // 根据startNode获取对应的startTime
          const timeItem = timeDataArray.find(item => item.node === course.startNode);
          if (timeItem && timeItem.startTime !== '00:00') {
            const startTimeParts = timeItem.startTime.split(':');
            // 检查是否已经存在相同时间的course节点
            const existingCourseNode = timeNodes.find(node => 
              node.type === 'course' && 
              node.timeHour === startTimeParts[0] && 
              node.timeMinute === startTimeParts[1]
            );
            
            // 总是添加course节点，即使时间相同
            timeNodes.push({
              type: 'course',
              timeHour: startTimeParts[0],
              timeMinute: startTimeParts[1],
              time: parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]) // 转换为分钟数用于排序
            });
            
            // 根据step确定结束时间点
            const endNode = course.startNode + course.step - 1;
            const endTimeItem = timeDataArray.find(item => item.node === endNode);
            if (endTimeItem && endTimeItem.endTime !== '00:00') {
              const endTimeParts = endTimeItem.endTime.split(':');
              // 检查是否已经存在相同时间的interval节点
              const existingIntervalNode = timeNodes.find(node => 
                node.type === 'interval' && 
                node.timeHour === endTimeParts[0] && 
                node.timeMinute === endTimeParts[1]
              );
              
              // 总是添加interval节点，即使时间相同
              timeNodes.push({
                type: 'interval',
                timeHour: endTimeParts[0],
                timeMinute: endTimeParts[1],
                time: parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]) // 转换为分钟数用于排序
              });
            }
          }
        });
        
        // 按时间排序所有节点
        timeNodes.sort((a, b) => {
          if (a.time !== b.time) {
            return a.time - b.time;
          }
          // 如果时间相同，course节点应该在interval节点之前
          if (a.type === 'course' && b.type === 'interval') {
            return -1;
          }
          if (a.type === 'interval' && b.type === 'course') {
            return 1;
          }
          // 如果类型相同，保持原有顺序
          return 0;
        });
        
        // 将排序后的节点添加到dayTemplate中
        timeNodes.forEach(node => {
          // 移除用于排序的time属性
          const { time, ...nodeWithoutTime } = node;
          dayTemplate.push(nodeWithoutTime);
        });
        
        // 添加end节点
        if (dayTemplate.length > 1) {
          // 移除最后一个interval节点
          const lastInterval = dayTemplate.pop();
          // 使用最后一个interval节点的时间作为end节点的时间
          dayTemplate.push({
            type: 'end',
            timeHour: lastInterval.timeHour,
            timeMinute: lastInterval.timeMinute
          });
        }
        
        // 将模板转换为字符串用于比较
        const templateStr = JSON.stringify(dayTemplate);
        
        // 检查是否已存在相同的模板
        if (templateMap.has(templateStr)) {
          // 如果已存在，记录该day对应的模板索引
          dayTemplateIndexMap.set(day, templateMap.get(templateStr));
        } else {
          // 如果不存在，添加新模板
          const newIndex = timetableTemplates.length;
          timetableTemplates.push(dayTemplate);
          templateMap.set(templateStr, newIndex);
          dayTemplateIndexMap.set(day, newIndex);
        }
      });
      
      // 生成courseSchedule
      // 为每个day生成courseSchedule条目
      allDays.forEach(day => {
        const dayCourses = courseScheduleArray.filter(item => item.day === day);
        
        // 如果该天没有课程安排
        if (dayCourses.length === 0) {
          courseSchedule.push({
            timetableId: -1,
            timetableRepeatability: 1,
            courseList: []
          });
        } else {
          // 先按照startNode对课程进行排序
          const sortedDayCourses = dayCourses.sort((a, b) => a.startNode - b.startNode);
          
          // 创建courseList数组，保留同一天的所有课程
          const courseList = sortedDayCourses.map(course => ({
            courseId: [course.id],
            courseRepeatability: 1
          }));
          
          // 添加到courseSchedule，使用去重后的模板索引
          courseSchedule.push({
            timetableId: [dayTemplateIndexMap.get(day)],
            timetableRepeatability: 1,
            courseList: courseList
          });
        }
      });
      
      // 处理没有课程的day（如果需要的话，可以添加额外的逻辑）
      // 这里暂时不处理，因为用户没有明确要求

      // 创建目标JSON对象
      const outputJson = {
        basic: {
          name: tableName,
          courseStart: courseStart,
          courseEnd: courseEnd,
          createTime: "",
          updateTime: "",
          dataStructureVersion: "1.1"
        },
        courses: courses,
        timetableTemplate: timetableTemplates,
        courseSchedule: courseSchedule
      };
      
      // 写入输出文件
      
      console.log(`成功提取信息: 课表名称=${tableName}, 开始日期=${courseStart}, 结束日期=${courseEnd}`);
      console.log(`提取并去重后得到${courses.length}门课程`);
      console.log(outputJson);
      console.log('完整的输出结果:');
      console.log(JSON.stringify(outputJson, null, 2));

      return outputJson
    } else {
      console.error('未找到必要的字段');
    }
  } catch (error) {
    console.error(`处理文件时出错: ${error.message}`);
  }
}

export default extractCourseData


let inputJson = `
{"courseLen":45,"id":1,"name":"默认","sameBreakLen":false,"sameLen":true,"theBreakLen":10}
[{"endTime":"08:45","node":1,"startTime":"08:00","timeTable":1},{"endTime":"09:40","node":2,"startTime":"08:55","timeTable":1},{"endTime":"10:50","node":3,"startTime":"10:05","timeTable":1},{"endTime":"11:45","node":4,"startTime":"11:00","timeTable":1},{"endTime":"15:15","node":5,"startTime":"14:30","timeTable":1},{"endTime":"16:15","node":6,"startTime":"15:30","timeTable":1},{"endTime":"16:25","node":7,"startTime":"15:40","timeTable":1},{"endTime":"17:25","node":8,"startTime":"16:40","timeTable":1},{"endTime":"19:15","node":9,"startTime":"18:30","timeTable":1},{"endTime":"20:15","node":10,"startTime":"19:30","timeTable":1},{"endTime":"21:15","node":11,"startTime":"20:30","timeTable":1},{"endTime":"22:10","node":12,"startTime":"21:25","timeTable":1},{"endTime":"22:20","node":13,"startTime":"21:35","timeTable":1},{"endTime":"22:30","node":14,"startTime":"21:45","timeTable":1},{"endTime":"22:40","node":15,"startTime":"21:55","timeTable":1},{"endTime":"22:50","node":16,"startTime":"22:05","timeTable":1},{"endTime":"23:00","node":17,"startTime":"22:15","timeTable":1},{"endTime":"23:10","node":18,"startTime":"22:25","timeTable":1},{"endTime":"23:20","node":19,"startTime":"22:35","timeTable":1},{"endTime":"23:30","node":20,"startTime":"22:45","timeTable":1},{"endTime":"23:40","node":21,"startTime":"22:55","timeTable":1},{"endTime":"23:50","node":22,"startTime":"23:05","timeTable":1},{"endTime":"00:00","node":23,"startTime":"23:15","timeTable":1},{"endTime":"00:00","node":24,"startTime":"23:25","timeTable":1},{"endTime":"00:00","node":25,"startTime":"23:35","timeTable":1},{"endTime":"00:00","node":26,"startTime":"23:45","timeTable":1},{"endTime":"00:00","node":27,"startTime":"23:51","timeTable":1},{"endTime":"00:00","node":28,"startTime":"23:56","timeTable":1},{"endTime":"00:45","node":29,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":30,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":31,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":32,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":33,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":34,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":35,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":36,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":37,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":38,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":39,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":40,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":41,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":42,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":43,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":44,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":45,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":46,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":47,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":48,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":49,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":50,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":51,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":52,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":53,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":54,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":55,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":56,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":57,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":58,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":59,"startTime":"00:00","timeTable":1},{"endTime":"00:45","node":60,"startTime":"00:00","timeTable":1}]
{"background":"","courseTextColor":-1,"id":3,"itemAlpha":50,"itemHeight":64,"itemTextSize":12,"maxWeek":1,"nodes":6,"showOtherWeekCourse":true,"showSat":true,"showSun":true,"showTime":false,"startDate":"2025-8-22","strokeColor":-2130706433,"sundayFirst":false,"tableName":"2508 暑假补课","textColor":-16777216,"timeTable":1,"type":0,"widgetCourseTextColor":-1,"widgetItemAlpha":50,"widgetItemHeight":64,"widgetItemTextSize":12,"widgetStrokeColor":-2130706433,"widgetTextColor":-16777216}
[{"color":"#ff2196f3","courseName":"物理","credit":0.0,"id":0,"note":"","tableId":3},{"color":"#ff2979ff","courseName":"生物","credit":0.0,"id":1,"note":"","tableId":3},{"color":"#ff1de9b6","courseName":"地理","credit":0.0,"id":2,"note":"","tableId":3},{"color":"#ffa375ff","courseName":"语文","credit":0.0,"id":3,"note":"","tableId":3},{"color":"#ffff9100","courseName":"英语","credit":0.0,"id":4,"note":"","tableId":3},{"color":"#ff1de9b6","courseName":"数学","credit":0.0,"id":5,"note":"","tableId":3}]
[{"day":6,"endTime":"","endWeek":1,"id":0,"level":0,"ownTime":false,"room":"本班","startNode":1,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":1,"endTime":"","endWeek":1,"id":0,"level":0,"ownTime":false,"room":"本班","startNode":3,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":6,"endTime":"","endWeek":1,"id":0,"level":0,"ownTime":false,"room":"本班","startNode":2,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":1,"endTime":"","endWeek":1,"id":0,"level":0,"ownTime":false,"room":"本班","startNode":4,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":3,"endTime":"","endWeek":1,"id":0,"level":0,"ownTime":false,"room":"本班","startNode":1,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":3,"endTime":"","endWeek":1,"id":0,"level":0,"ownTime":false,"room":"本班","startNode":2,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":6,"endTime":"","endWeek":1,"id":1,"level":0,"ownTime":false,"room":"走班","startNode":3,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":6,"endTime":"","endWeek":1,"id":1,"level":0,"ownTime":false,"room":"走班","startNode":4,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":1,"endTime":"","endWeek":1,"id":1,"level":0,"ownTime":false,"room":"走班","startNode":1,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":1,"endTime":"","endWeek":1,"id":1,"level":0,"ownTime":false,"room":"走班","startNode":2,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":3,"endTime":"","endWeek":1,"id":1,"level":0,"ownTime":false,"room":"走班","startNode":3,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":3,"endTime":"","endWeek":1,"id":1,"level":0,"ownTime":false,"room":"走班","startNode":4,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":6,"endTime":"","endWeek":1,"id":2,"level":0,"ownTime":false,"room":"本班","startNode":5,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":6,"endTime":"","endWeek":1,"id":2,"level":0,"ownTime":false,"room":"本班","startNode":6,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":1,"endTime":"","endWeek":1,"id":2,"level":0,"ownTime":false,"room":"本班","startNode":5,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":1,"endTime":"","endWeek":1,"id":2,"level":0,"ownTime":false,"room":"本班","startNode":6,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":3,"endTime":"","endWeek":1,"id":2,"level":0,"ownTime":false,"room":"本班","startNode":5,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":3,"endTime":"","endWeek":1,"id":2,"level":0,"ownTime":false,"room":"本班","startNode":6,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":7,"endTime":"","endWeek":1,"id":4,"level":0,"ownTime":false,"room":"本班","startNode":3,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":7,"endTime":"","endWeek":1,"id":4,"level":0,"ownTime":false,"room":"本班","startNode":4,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":2,"endTime":"","endWeek":1,"id":4,"level":0,"ownTime":false,"room":"本班","startNode":5,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":2,"endTime":"","endWeek":1,"id":4,"level":0,"ownTime":false,"room":"本班","startNode":6,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":7,"endTime":"","endWeek":1,"id":5,"level":0,"ownTime":false,"room":"本班","startNode":5,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":7,"endTime":"","endWeek":1,"id":5,"level":0,"ownTime":false,"room":"本班","startNode":6,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":2,"endTime":"","endWeek":1,"id":5,"level":0,"ownTime":false,"room":"本班","startNode":1,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":2,"endTime":"","endWeek":1,"id":5,"level":0,"ownTime":false,"room":"本班","startNode":2,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":2,"endTime":"","endWeek":1,"id":3,"level":0,"ownTime":false,"room":"本班","startNode":3,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":2,"endTime":"","endWeek":1,"id":3,"level":0,"ownTime":false,"room":"本班","startNode":4,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":7,"endTime":"","endWeek":1,"id":3,"level":0,"ownTime":false,"room":"本班","startNode":1,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":7,"endTime":"","endWeek":1,"id":3,"level":0,"ownTime":false,"room":"本班","startNode":2,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0},{"day":5,"endTime":"","endWeek":1,"id":3,"level":0,"ownTime":false,"room":"本班","startNode":6,"startTime":"","startWeek":1,"step":1,"tableId":3,"teacher":"","type":0}]
`;

const result = extractCourseData(inputJson);
console.log('完整的输出结果:');
console.log(JSON.stringify(result, null, 2));