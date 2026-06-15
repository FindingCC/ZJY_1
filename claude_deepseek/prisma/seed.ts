import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 清除已有数据
  await prisma.reminderLog.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.templateChecklistItem.deleteMany();
  await prisma.projectNode.deleteMany();
  await prisma.constructionTemplate.deleteMany();

  // 内置施工节点模板
  const templates = [
    {
      name: "施工准备",
      category: "准备阶段",
      order: 1,
      defaultDays: 15,
      description: "施工组织设计审批、人员进场、机具检验、材料计划、临建搭设",
      items: ["施工组织设计审批", "施工人员进场报验", "施工机具检验", "材料进场计划", "临建搭设", "分包匹配申请", "经法合同流程", "农民工三方协议", "终生质量责任书", "法人授权书", "项目部章刻印", "施工机具进场报审", "测量器具报审", "七牌一图"],
    },
    {
      name: "施工测量及放线",
      category: "准备阶段",
      order: 2,
      defaultDays: 7,
      description: "测量仪器校准、控制桩复核、放线记录",
      items: ["测量仪器校准证书核查", "控制桩复核记录", "放线记录"],
    },
    {
      name: "土建施工",
      category: "土建阶段",
      order: 3,
      defaultDays: 45,
      description: "地基验槽、钢筋隐蔽验收、混凝土浇筑、模板拆除、基础验收",
      items: ["地基验槽记录", "钢筋隐蔽验收", "混凝土浇筑报审", "模板拆除申请", "基础验收", "安全文明施工台账"],
    },
    {
      name: "设备基础及预埋件",
      category: "土建阶段",
      order: 4,
      defaultDays: 20,
      description: "基础尺寸复核、预埋件位置确认、接地网敷设、混凝土强度报告",
      items: ["基础尺寸复核", "预埋件位置确认", "接地网敷设记录", "基础混凝土强度报告"],
    },
    {
      name: "主变压器安装",
      category: "安装阶段",
      order: 5,
      defaultDays: 30,
      description: "变压器安装、吊装方案、真空注油、试验报告",
      items: ["变压器出厂合格证", "吊装方案审批", "安装技术交底", "真空注油记录", "试验报告", "附件与油样检测（第1次）", "附件与油样检测（第2次）", "附件与油样检测（第3次）", "试验方案审批", "脚手架安装方案审批", "大型机械报审"],
    },
    {
      name: "高压设备安装",
      category: "安装阶段",
      order: 6,
      defaultDays: 25,
      description: "GIS设备检验、断路器调整、隔离开关安装、CT/PT试验",
      items: ["GIS设备检验", "断路器调整记录", "隔离开关安装记录", "CT/PT试验报告"],
    },
    {
      name: "低压设备安装",
      category: "安装阶段",
      order: 7,
      defaultDays: 20,
      description: "开关柜检验、母线安装、二次回路检查",
      items: ["开关柜检验记录", "母线安装记录", "二次回路检查"],
    },
    {
      name: "控制保护系统安装",
      category: "安装阶段",
      order: 8,
      defaultDays: 25,
      description: "保护屏柜安装、控制电缆敷设、抗干扰接地",
      items: ["保护屏柜安装记录", "控制电缆敷设记录", "抗干扰接地检查"],
    },
    {
      name: "电缆敷设及接线",
      category: "安装阶段",
      order: 9,
      defaultDays: 30,
      description: "电缆清册核对、绝缘测试、接线检查、防火封堵",
      items: ["电缆清册核对", "电缆绝缘测试", "接线正确性检查", "电缆防火封堵"],
    },
    {
      name: "调试试验",
      category: "调试阶段",
      order: 10,
      defaultDays: 35,
      description: "单体调试、系统联调、保护定值整定、远动通信、带负荷试验",
      items: ["单体调试报告", "系统联调方案", "保护装置定值整定", "远动通信测试", "带负荷试验", "角比差试验（停电）", "母差试验（停电）"],
    },
    {
      name: "竣工验收",
      category: "验收阶段",
      order: 11,
      defaultDays: 15,
      description: "竣工资料汇总、启动验收、质监站验收、送电方案审批、启动试运行",
      items: ["竣工资料汇总", "启动验收委员会成立", "质监站验收", "送电方案审批", "启动试运行"],
    },
  ];

  for (const t of templates) {
    const template = await prisma.constructionTemplate.create({
      data: {
        name: t.name,
        category: t.category,
        order: t.order,
        defaultDays: t.defaultDays,
        description: t.description,
        checklistItems: {
          create: t.items.map((content, i) => ({
            content,
            order: i + 1,
          })),
        },
      },
    });
    console.log(`✓ 模板: ${template.name} (${t.items.length}个清单项)`);
  }

  // 创建一些示例项目节点（方便演示提醒功能）
  const today = new Date();
  const fmt = (d: Date, offset: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + offset);
    return nd.toISOString().split("T")[0];
  };

  const sampleNodes = [
    { name: "施工准备", templateName: "施工准备", startOffset: -10, endOffset: -2 },
    { name: "施工测量及放线", templateName: "施工测量及放线", startOffset: -8, endOffset: 3 },
    { name: "主变压器安装", templateName: "主变压器安装", startOffset: -5, endOffset: 7 },
    { name: "电缆敷设及接线", templateName: "电缆敷设及接线", startOffset: -3, endOffset: -1 },
  ];

  for (const sn of sampleNodes) {
    const template = await prisma.constructionTemplate.findFirst({
      where: { name: sn.templateName },
      include: { checklistItems: true },
    });
    if (!template) continue;

    const node = await prisma.projectNode.create({
      data: {
        name: sn.name,
        order: template.order,
        startDate: fmt(today, sn.startOffset),
        endDate: fmt(today, sn.endOffset),
        status: "IN_PROGRESS",
        templateId: template.id,
        checklistItems: {
          create: template.checklistItems.map((ci) => ({
            content: ci.content,
            order: ci.order,
            isCompleted: Math.random() > 0.6,
          })),
        },
      },
    });
    console.log(`✓ 示例节点: ${node.name} (${sn.startOffset}~${sn.endOffset}天)`);
  }

  // 确保逾期节点被正确标记
  await prisma.projectNode.updateMany({
    where: { status: "IN_PROGRESS" },
    data: { status: "IN_PROGRESS" },
  });

  console.log("\n✅ Seed 数据创建完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
