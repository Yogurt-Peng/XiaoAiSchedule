const fs = require('fs')
var jsdom = require("jsdom");
var cheerio = require('cheerio')
var JSDOM = jsdom.JSDOM;
var table = fs.readFileSync('1.txt', 'utf-8');
var document = new JSDOM(table).window.document;

function scheduleHtmlParser(html)
{



    let courseAll = []; // 课程数组

    let $ = cheerio.load(html, { decodeEntities: false }); // 加载HTML内容

    const tbodyRows = $('tbody').children(); // tbody元素的子行集合

    // 从1开始跳过星期表头
    for (let dayIndex = 1; dayIndex < tbodyRows.length; dayIndex++)
    {
        const dayRow = tbodyRows[dayIndex]; // 当前星期行元素

        const dayCells = $(dayRow).children(); // 当前星期行的单元格集合
        // 从1开始跳过节次
        for (let sectionIndex = 1; sectionIndex < dayCells.length; sectionIndex++)
        {
            const sectionCell = dayCells[sectionIndex]; // 当前单元格元素

            const sectionChildren = $(sectionCell).children();// 获取当前单元格里面所有元素

            for (let childIndex = 0; childIndex < sectionChildren.length; childIndex++)
            {
                const childElement = sectionChildren[childIndex];

                const none = /display\s?:\s?none/;
                // 获取有课表的元素
                if (childElement.name == 'div' && !(childElement.attribs && (childElement.attribs.type == 'hidden' || none.test(childElement.attribs.style))))
                {
                    let course = { name: '' };

                    for (let nodeIndex = 0; nodeIndex < childElement.childNodes.length; nodeIndex++)
                    {
                        const node = childElement.childNodes[nodeIndex];
                        // 取课程名与周次，有重复
                        if (node.type == 'text' && node.data.trim())
                        {
                            // 分割线 "-----------" 同一个时间不同周次的课程要分开
                            if (/^[-]+/.test(node.data.trim()))
                            {
                                courseAll.push(course);
                                course = { name: '' };
                                continue;
                            }
                            // 课程名称
                            course.name = node.data.trim();
                            // 课程星期
                            course.day = sectionIndex;
                        }
                        else if (!(node.attribs && none.test(node.attribs.style)))
                        {

                            if (node.name == 'font')
                            {
                                if (node.attribs && node.attribs.title && node.attribs.title.includes('老师'))
                                {
                                    course.teacher = $(node).text().trim() //授课老师
                                } else if (node.attribs && node.attribs.title && node.attribs.title.includes('周次'))
                                {

                                    course.weeks = []

                                    let info = $(node).text().trim();
                                    course.sections = info.match(/\[(\S*)节/)[1].split('-').map(Number)//课程节次

                                    info = info.replace(/\(周\)\[.*?\]/g, '');

                                    // 含有-号分割
                                    if (info.match(/\b\d+-\d+\b/))// 匹配数字-数字
                                    {
                                        // 还包括逗号分割的单独周次
                                        if (info.includes(','))
                                        {
                                            const weeksArray = info.split(','); // 按逗号分割周次字符串成数组
                                            weeksArray.forEach(week =>
                                            {
                                                if (week.includes('-'))
                                                {
                                                    const [start, end] = week.split('-').map(Number); // 拆分连续周次的起始周次和结束周次
                                                    for (let i = start; i <= end; i++)
                                                    {
                                                        course.weeks.push(i); // 将连续周次范围内的周次都加入到数组中
                                                    }

                                                } else
                                                {
                                                    course.weeks.push(Number(week)); // 将单个周次直接加入到数组中

                                                }
                                            });

                                        }
                                        // 只含有-号分割
                                        else
                                        {

                                            const [start, end] = info.split('-').map(Number); // 拆分连续周次的起始周次和结束周次
                                            for (let i = start; i <= end; i++)
                                            {
                                                course.weeks.push(i); // 将连续周次范围内的周次都加入到数组中
                                            }
                                        }

                                    } else if (info.includes(',') && !info.includes('-')) // 只有逗号分隔
                                    {
                                        course.weeks = info.split(',').map(str => str.replace(/\D/g, ''))
                                        course.weeks = course.weeks.map(str => parseInt(str, 10));

                                    } else if (!info.includes(',') && !info.includes('-'))// 单个数字
                                    {
                                        course.weeks = [Number(info)]
                                    }


                                } else if (node.attribs && node.attribs.title && node.attribs.title.includes('教室'))
                                {
                                    //上课地点
                                    course.position = $(node).text().trim()
                                }
                            }

                        }

                    }
                    if (course.name)
                    {
                        //遍历result，如果有相同的课程，就合并
                        let flag = false
                        courseAll.forEach((v, i) =>
                        {
                            if (v.name == course.name && v.day == course.day && v.sections.toString() == course.sections.toString() && v.position == course.position)
                            {
                                flag = true
                                v.weeks = [...new Set([...v.weeks, ...course.weeks])]
                            }

                        })
                        if (!flag)
                            courseAll.push(course)
                    }
                }



            }
        }
    }
    console.log(courseAll);
    return courseAll; // 返回课程数组
}
var result = scheduleHtmlParser(table);
console.log(result)
debugger;
