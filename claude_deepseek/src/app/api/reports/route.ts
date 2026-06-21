import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookies } from "@/lib/auth";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, ShadingType,
} from "docx";

// GET /api/reports?projectId=1&type=weekly|monthly
export async function GET(request: NextRequest) {
  const user = getUserFromCookies(request.headers.get("cookie"));
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type") || "weekly";

  if (!projectId) {
    return NextResponse.json({ success: false, error: "缺少工程ID" }, { status: 400 });
  }

  const pid = parseInt(projectId);
  const project = await prisma.project.findUnique({ where: { id: pid } });
  if (!project) return NextResponse.json({ success: false, error: "工程不存在" }, { status: 404 });

  const nodes = await prisma.projectNode.findMany({
    where: { projectId: pid },
    include: {
      checklistItems: true,
      template: { select: { name: true, category: true } },
    },
    orderBy: { order: "asc" },
  });

  // Statistics
  const total = nodes.length;
  const completed = nodes.filter((n) => n.status === "COMPLETED").length;
  const inProgress = nodes.filter((n) => n.status === "IN_PROGRESS").length;
  const overdue = nodes.filter((n) => n.status === "OVERDUE").length;
  const pending = nodes.filter((n) => n.status === "PENDING").length;

  // Column config
  const hdr = (text: string, w: number) =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, font: "SimSun", size: 21 })],
      alignment: AlignmentType.CENTER,
    });
  const headRow = (texts: string[]) =>
    new TableRow({
      tableHeader: true,
      children: texts.map((t) =>
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          shading: { type: ShadingType.SOLID, color: "1F4E79" },
          children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, font: "SimSun", size: 20, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
        })
      ),
    });
  const cell = (text: string) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, font: "SimSun", size: 20 })], alignment: AlignmentType.CENTER })],
    });
  const labelCell = (text: string) =>
    new TableCell({
      width: { size: 2500, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text, font: "SimSun", size: 20 })], alignment: AlignmentType.RIGHT })],
      margins: { right: 200 },
    });
  const valueCell = (text: string) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, font: "SimSun", size: 20, bold: true })], alignment: AlignmentType.LEFT })],
    });

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const titleText = type === "weekly" ? "施工周报" : "施工月报";

  // Table: node progress
  const nodeRows = [
    headRow(["序号", "节点名称", "状态", "清单进度", "截止日期"]),
    ...nodes.map((n, i) =>
      new TableRow({
        children: [
          cell(String(i + 1)),
          cell(n.name),
          cell(n.status === "COMPLETED" ? "已完成" : n.status === "IN_PROGRESS" ? "进行中" : n.status === "OVERDUE" ? "逾期" : "未开始"),
          cell(`${n.checklistItems.filter((c) => c.isCompleted).length}/${n.checklistItems.length}`),
          cell(n.endDate || "未设置"),
        ],
      })
    ),
  ];

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "SimSun", size: 22 } } },
    },
    sections: [
      {
        properties: { page: { margin: { top: 1200, bottom: 1200, left: 1400, right: 1400 } } },
        children: [
          // Title
          new Paragraph({
            text: project.name,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
          }),
          new Paragraph({
            text: titleText,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `日期：${dateStr}`, font: "SimSun", size: 22 })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
          }),

          // Summary
          new Paragraph({ text: "一、工程概况", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  labelCell("节点总数："), valueCell(`${total} 个`),
                  labelCell("已完成："), valueCell(`${completed} 个 (${total > 0 ? Math.round((completed / total) * 100) : 0}%)`),
                ],
              }),
              new TableRow({
                children: [
                  labelCell("进行中："), valueCell(`${inProgress} 个`),
                  labelCell("逾期："), valueCell(`${overdue} 个`),
                ],
              }),
              new TableRow({
                children: [
                  labelCell("未开始："), valueCell(`${pending} 个`),
                  labelCell(""), valueCell(""),
                ],
              }),
            ],
          }),

          // Node details
          new Paragraph({ text: "二、施工节点进度", heading: HeadingLevel.HEADING_3, spacing: { before: 400, after: 100 } }),
          new Table({ width: { size: 9000, type: WidthType.DXA }, rows: nodeRows }),

          // Overdue
          ...(overdue > 0
            ? [
                new Paragraph({ text: "三、逾期节点", heading: HeadingLevel.HEADING_3, spacing: { before: 400, after: 100 } }),
                ...nodes
                  .filter((n) => n.status === "OVERDUE")
                  .map(
                    (n) =>
                      new Paragraph({
                        text: `• ${n.name}：截止日期 ${n.endDate}，已逾期`,
                        spacing: { after: 60 },
                      })
                  ),
              ]
            : []),

          // Upcoming
          new Paragraph({ text: "四、下周计划", heading: HeadingLevel.HEADING_3, spacing: { before: 400, after: 100 } }),
          ...nodes
            .filter((n) => n.status === "IN_PROGRESS" || n.status === "PENDING")
            .map(
              (n) =>
                new Paragraph({
                  text: `• ${n.name}：${n.checklistItems.filter((c) => c.isCompleted).length}/${n.checklistItems.length} 项清单已完成`,
                  spacing: { after: 60 },
                })
            ),

          // Footer
          new Paragraph({ text: "", spacing: { before: 600 } }),
          new Paragraph({
            text: "—— 本报告由通源变电施工管理系统自动生成 ——",
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const fname = encodeURIComponent(project.name + "_" + titleText + "_" + dateStr) + ".docx";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=\"" + fname + "\"",
    },
  });
}
