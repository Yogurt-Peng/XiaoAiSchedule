async function scheduleHtmlProvider(iframeContent = "", frameContent = "", dom = document) 
{
  var frame = dom.getElementsByName('Frame1')[0].offsetParent
    .children.mainCenterPanle.children[0].lastElementChild.children[1]
    .contentDocument.activeElement.childNodes[4].childNodes[1].childNodes[5].childNodes[6].outerHTML

 
  window. alert("请点击右上角的理论课表后再导入哦!");
  
  return frame
}
