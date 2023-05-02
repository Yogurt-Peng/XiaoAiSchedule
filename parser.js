const fs = require('fs')
var jsdom = require("jsdom");
var cheerio = require('cheerio')
var JSDOM = jsdom.JSDOM;
var table = fs.readFileSync('1.txt', 'utf-8');
var document = new JSDOM(table).window.document;



function scheduleHtmlParser(html) {
    let result = []
    let $ = cheerio.load(html, { decodeEntities: false })

    $('tbody').children().each(function (i, el) {

        if (i === 0) return;

        $(el).children().each(function (i1, el1) {

            if (i1 === 0) return;

            $(this).children().each((i2, el2) => {
                const none = new RegExp(/display\s?:\s?none/)


                if (el2.name == 'div' && !(el2.attribs && (el2.attribs.type == 'hidden' || none.test(el2.attribs.style)))) {
                    let cls = { name: '' }

                    el2.childNodes.forEach((node, index) => {


                        if (node.type == 'text') {
                            if (!node.data.trim()) return

                            //分割线  "-----------"  同一个时间不同周次的课程要分开
                            if (/^\-+$/.test(node.data.trim())) {
                                result.push(cls)
                                cls = { name: '' }
                                return
                            }
                            //课程名称
                            cls.name = node.data.trim()
                            //课程星期
                            cls.day = i1


                        } else 
                        {
                            if (node.attribs && none.test(node.attribs.style)) return

                            if (node.name == 'font') {
                                if (node.attribs && node.attribs.title && node.attribs.title.includes('老师')) {
                                    //授课老师
                                    cls.teacher = $(node).text().trim()
                                } else if (node.attribs && node.attribs.title && node.attribs.title.includes('周次')) {
                                    let str = /(\d+[\s\-]*\d+|\d+).*周/.exec($(node).text().trim())
                                    // console.log(str)
                                    // console.log(str[0])
                                    //课程节次
                                    cls.sections = $(node).text().trim().match(/\[(\S*)节/)[1].split('-').map(Number)
                                    //课程周次
                                    if (str[1].includes('-')) {
                                        let arr = str[1].split('-'),
                                            arr1 = Array(arr[1] - arr[0] + 1).fill().map((v, i) => +i + +arr[0].trim())


                                        if (str[0].includes('单周')) {
                                            cls.weeks = arr1.filter(v => v & 1)

                                        } else if (str[0].includes('双周')) {
                                            cls.weeks = arr1.filter(v => !(v & 1))

                                        } else { 
                                            cls.weeks = arr1
                                        }
                                    } else {

                                        cls.weeks = str[0].split(',').map(str => str.replace(/\D/g, ''))
                                        cls.weeks = cls.weeks.map(str => parseInt(str, 10));
                                    }
                                } else if (node.attribs && node.attribs.title && node.attribs.title.includes('教室')) {
                                    //上课地点
                                    cls.position = $(node).text().trim()
                                }
                            }
                        }
                    })
                    if (cls.name) {
                        //遍历result，如果有相同的课程，就合并
                        let flag = false
                        result.forEach((v, i) => {
                            if (v.name == cls.name && v.day == cls.day && v.sections.toString() == cls.sections.toString() && v.position == cls.position) {
                                flag = true
                                v.weeks = [...new Set([...v.weeks, ...cls.weeks])]
                            }

                        })
                        if (!flag)
                            result.push(cls)
                    }
                }
            })
        })
    })

    return result
}

var result = scheduleHtmlParser(table);


debugger;
