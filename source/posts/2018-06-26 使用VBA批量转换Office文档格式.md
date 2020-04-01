```
title: 使用VBA批量转换Office文档格式
date: 2018-06-26 19:15:10
category: Code
tags: VBA Office Batch Convert
description: 例如，转换doc到docx
```

### Introduction

新建一个文件，创建一个宏，把宏的内容替换成如下代码即可。

想要转换成别的格式，请参考各个组件的`FileFormat`枚举。

若要在转换完成后删除原文件，请代码开头把`delSourceFile`的值改成`True`。

### Code

#### DOC to DOCX

```vb
Sub FormatConverter()
delSourceFile=False
Dim myDialog As FileDialog
Dim oFile As Variant
Set myDialog=Application.FileDialog(msoFileDialogFilePicker)
Set myFileSystem=CreateObject("scripting.filesystemobject")
With myDialog
.Filters.Clear
.Filters.Add "doc File","*.doc",1
.AllowMultiSelect=True
If .Show=-1 Then
For Each oFile In .SelectedItems
With Documents.Open(oFile)
.SaveAs Replace(oFile,".doc",".docx"),12
.Close
End With
If delSourceFile=True Then
myFileSystem.deletefile(oFile)
End If
Next
End If
End With
End Sub
```

#### DOCX to DOC

```vb
Sub FormatConverter()
delSourceFile=False
Dim myDialog As FileDialog
Dim oFile As Variant
Set myDialog=Application.FileDialog(msoFileDialogFilePicker)
Set myFileSystem=CreateObject("scripting.filesystemobject")
With myDialog
.Filters.Clear
.Filters.Add "docx File","*.docx",1
.AllowMultiSelect=True
If .Show=-1 Then
For Each oFile In .SelectedItems
With Documents.Open(oFile)
.SaveAs Replace(oFile,".docx",".doc"),0
.Close
End With
If delSourceFile=True Then
myFileSystem.deletefile(oFile)
End If
Next
End If
End With
End Sub
```

#### XLS to XLSX

```vb
Sub FormatConverter()
delSourceFile=False
Dim myDialog As FileDialog
Dim oFile As Variant
Set myDialog=Application.FileDialog(msoFileDialogFilePicker)
Set myFileSystem=CreateObject("scripting.filesystemobject")
With myDialog
.Filters.Clear
.Filters.Add "xls File","*.xls",1
.AllowMultiSelect=True
If .Show=-1 Then
For Each oFile In .SelectedItems
With Workbooks.Open(oFile)
.SaveAs Replace(oFile,".xls",".xlsx"),51
.Close
End With
If delSourceFile=True Then
myFileSystem.deletefile(oFile)
End If
Next
End If
End With
End Sub
```

#### XLSX to XLS

```vb
Sub FormatConverter()
delSourceFile=False
Dim myDialog As FileDialog
Dim oFile As Variant
Set myDialog=Application.FileDialog(msoFileDialogFilePicker)
Set myFileSystem=CreateObject("scripting.filesystemobject")
With myDialog
.Filters.Clear
.Filters.Add "xlsx File","*.xlsx",1
.AllowMultiSelect=True
If .Show=-1 Then
For Each oFile In .SelectedItems
With Workbooks.Open(oFile)
.SaveAs Replace(oFile,".xlsx",".xls"),56
.Close
End With
If delSourceFile=True Then
myFileSystem.deletefile(oFile)
End If
Next
End If
End With
End Sub
```

#### PPT to PPTX

```vb
Sub FormatConverter()
delSourceFile=False
Dim myDialog As FileDialog
Dim oFile As Variant
Set myDialog=Application.FileDialog(msoFileDialogFilePicker)
Set myFileSystem=CreateObject("scripting.filesystemobject")
With myDialog
.Filters.Clear
.Filters.Add "ppt File","*.ppt",1
.AllowMultiSelect=True
If .Show=-1 Then
For Each oFile In .SelectedItems
With Presentations.Open(oFile)
.SaveAs Replace(oFile,".ppt",".pptx"),11
.Close
End With
If delSourceFile=True Then
myFileSystem.deletefile(oFile)
End If
Next
End If
End With
End Sub
```

#### PPTX to PPT

```vb
Sub FormatConverter()
delSourceFile=False
Dim myDialog As FileDialog
Dim oFile As Variant
Set myDialog=Application.FileDialog(msoFileDialogFilePicker)
Set myFileSystem=CreateObject("scripting.filesystemobject")
With myDialog
.Filters.Clear
.Filters.Add "pptx File","*.pptx",1
.AllowMultiSelect=True
If .Show=-1 Then
For Each oFile In .SelectedItems
With Presentations.Open(oFile)
.SaveAs Replace(oFile,".pptx",".ppt"),1
.Close
End With
If delSourceFile=True Then
myFileSystem.deletefile(oFile)
End If
Next
End If
End With
End Sub
```

### Update History

#### 20180823

* 补充了适用于Excel的代码。

* 其他修改。

#### 20180626

* 首个版本。
