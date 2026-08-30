import Image from "next/image";
import {
  ArrowPathRoundedSquareIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  DocumentCheckIcon,
  EnvelopeIcon,
  HomeModernIcon,
  RectangleStackIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import type {
  SiteConfig,
  WebsiteCompareRow,
  WebsiteFeature,
  WebsiteShowcaseImage,
  WebsiteTextCard,
} from "@/lib/site-config";
import { resolvePublicHref } from "@/lib/public-site";

const privateCopyPattern =
  /(终验|验收|回归|工作树|角色路径|审批治理|去重|防重复|赠送|平台凭证|一致性闭环|状态回写|管理后台|开放平台|源码|数据库|\bDB\b|\bCLI\b|\bMCP\b|\bAgent\b|user_final_required|blocked|partial)/i;

const defaultFeatures: WebsiteFeature[] = [
  {
    title: "合同发起与电子签署",
    description:
      "在线创建合同、设置签署方并持续查看签署进度，让业务人员清楚掌握每一份合同的状态。",
    tags: ["合同发起", "签署进度"],
  },
  {
    title: "模板与合同文书",
    description:
      "复用企业合同模板，生成 PDF 文书，并完成下载、查看和归档等日常管理。",
    tags: ["合同模板", "PDF 文书"],
  },
  {
    title: "审批与过程留痕",
    description:
      "在签署前完成内部审批，集中查看待办、处理记录与节点状态，减少线下反复确认。",
    tags: ["先审后签", "过程留痕"],
  },
  {
    title: "合同智能辅助",
    description:
      "可按部署环境接入模型服务，辅助完成合同生成、内容审查和版本比对。",
    tags: ["合同生成", "审查比对"],
  },
  {
    title: "H5 与小程序协同",
    description:
      "在移动端查看合同、处理审批和进入签署流程，与 Web 端共享同一业务数据。",
    tags: ["H5", "小程序"],
  },
  {
    title: "开放接口与私有化部署",
    description:
      "支持企业品牌配置、系统集成和私有化交付，适配不同的数据与部署边界。",
    tags: ["API 集成", "私有化部署"],
  },
];

const defaultAdvantages: WebsiteTextCard[] = [
  {
    title: "流程更清楚",
    description: "合同从发起、审批、签署到归档都有明确入口和状态反馈。",
  },
  {
    title: "协作更顺畅",
    description: "管理端、用户端和移动端围绕同一份合同数据协同处理。",
  },
  {
    title: "交付更灵活",
    description: "按企业环境选择标准使用、品牌配置、系统集成或私有化部署。",
  },
  {
    title: "数据更可控",
    description: "关键业务数据留在约定的部署边界内，便于企业持续管理。",
  },
];

const defaultIndustries: WebsiteTextCard[] = [
  {
    title: "人力资源",
    description: "劳动合同、保密协议、入职材料等人员文件签署。",
  },
  {
    title: "销售与采购",
    description: "销售合同、采购订单、合作协议的发起与进度跟踪。",
  },
  {
    title: "企业服务",
    description: "服务协议、项目确认单及交付材料的统一管理。",
  },
  {
    title: "租赁与物业",
    description: "租赁合同、物业服务协议及设备租赁文件管理。",
  },
];

const defaultCompare: WebsiteCompareRow[] = [
  { feature: "合同发起、签署与归档", standard: true, flagship: true },
  { feature: "合同模板与 PDF 文书", standard: true, flagship: true },
  { feature: "Web、H5 与小程序入口", standard: true, flagship: true },
  {
    feature: "签署前审批与过程留痕",
    standard: "基础流程",
    flagship: "完整流程",
  },
  { feature: "合同生成、审查与比对", standard: false, flagship: true },
  { feature: "品牌配置与私有化部署", standard: false, flagship: true },
  {
    feature: "开放接口与集成支持",
    standard: "基础接口",
    flagship: "按项目交付",
  },
];

const defaultProductImages: Record<"web" | "mobile", WebsiteShowcaseImage> = {
  web: {
    src: "/product-images/09-pc-compare-current.png",
    alt: "一合通用户后台合同比对界面",
    category: "web",
    span: "wide",
  },
  mobile: {
    src: "/product-images/10-h5-home-current.png",
    alt: "一合通 H5 首页",
    category: "mobile",
    span: "tall",
  },
};

const featureIcons = [
  DocumentCheckIcon,
  RectangleStackIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  ServerStackIcon,
];

const featureIconStyles = [
  "bg-blue-50 text-[#1a5276]",
  "bg-emerald-50 text-[#1e8449]",
  "bg-orange-50 text-[#e67e22]",
  "bg-blue-50 text-[#1a5276]",
  "bg-emerald-50 text-[#1e8449]",
  "bg-orange-50 text-[#e67e22]",
];

const advantageIcons = [
  ShieldCheckIcon,
  ArrowPathRoundedSquareIcon,
  ServerStackIcon,
  DocumentCheckIcon,
];
const industryIcons = [
  UserGroupIcon,
  ShoppingBagIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
];

function publicText(value: unknown) {
  return (
    typeof value === "string" && value.trim() && !privateCopyPattern.test(value)
  );
}

function resolveFeatures(config: SiteConfig) {
  const configured = (config.websiteContent.features || []).filter(
    (item) => publicText(item.title) && publicText(item.description),
  );
  const merged = [...configured];
  for (const fallback of defaultFeatures) {
    if (!merged.some((item) => item.title === fallback.title)) {
      merged.push(fallback);
    }
  }
  return merged.slice(0, 6);
}

function resolveCards(
  configured: WebsiteTextCard[] | undefined,
  fallback: WebsiteTextCard[],
  minimum: number,
) {
  const safe = (configured || []).filter(
    (item) => publicText(item.title) && publicText(item.description),
  );
  return safe.length >= minimum ? safe : fallback;
}

function resolveCompareRows(config: SiteConfig) {
  const safe = (config.websiteContent.versionCompare || []).filter((item) => {
    const copy = `${item.feature} ${String(item.standard)} ${String(item.flagship)}`;
    return publicText(item.feature) && !privateCopyPattern.test(copy);
  });
  return safe.length >= 5 ? safe.slice(0, 7) : defaultCompare;
}

function resolveProductImages(config: SiteConfig) {
  const configured = config.websiteContent.productImages || [];
  return {
    web:
      configured.find(
        (item) =>
          item.category === "web" &&
          item.src === defaultProductImages.web.src &&
          publicText(item.alt),
      ) || defaultProductImages.web,
    mobile:
      configured.find(
        (item) =>
          item.category === "mobile" &&
          item.src === defaultProductImages.mobile.src &&
          publicText(item.alt),
      ) || defaultProductImages.mobile,
  };
}

function CompareValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <CheckIcon className="mx-auto h-5 w-5 text-[#1e8449]" aria-label="包含" />
    );
  }
  if (value === false) {
    return (
      <span className="text-slate-400" aria-label="不包含">
        -
      </span>
    );
  }
  return <span>{value}</span>;
}

export default function HomeOriginal({ config }: { config: SiteConfig }) {
  const features = resolveFeatures(config);
  const advantages = resolveCards(
    config.websiteContent.advantages,
    defaultAdvantages,
    3,
  ).slice(0, 4);
  const industries = resolveCards(
    config.websiteContent.industries,
    defaultIndustries,
    4,
  ).slice(0, 4);
  const compareRows = resolveCompareRows(config);
  const productImages = resolveProductImages(config);
  const primaryHref = resolvePublicHref(config.websiteCtaLink, "#contact");
  const demoHref = resolvePublicHref(config.websiteDemoUrl, "#product");
  const userHref = resolvePublicHref(config.websiteUserUrl, "");
  const sourceHref = resolvePublicHref(config.websiteSourceUrl, "");
  const contactHref = config.websiteContactEmail
    ? `mailto:${config.websiteContactEmail}?subject=${encodeURIComponent(`${config.projectName}产品咨询`)}`
    : userHref || "#top";

  return (
    <main>
      <section
        id="top"
        className="overflow-hidden border-b border-slate-200 bg-[#f7f9fa]"
      >
        <div className="relative mx-auto min-h-[700px] max-w-[1200px] px-4 py-10 sm:px-8 md:min-h-[590px] md:py-16 lg:px-0">
          <div className="absolute bottom-4 right-4 flex h-[270px] items-end justify-end sm:right-8 md:bottom-auto md:right-[-72px] md:top-1/2 md:h-auto md:-translate-y-1/2">
            <Image
              src={productImages.web.src}
              alt={productImages.web.alt}
              width={1032}
              height={650}
              className="hidden w-[720px] max-w-none rounded-md shadow-[0_20px_45px_rgba(26,82,118,0.16)] md:block"
              priority
            />
            <Image
              src={productImages.mobile.src}
              alt={productImages.mobile.alt}
              width={390}
              height={844}
              className="h-[270px] w-auto rounded-md shadow-[0_18px_38px_rgba(26,82,118,0.16)] md:hidden"
              priority
              unoptimized
            />
          </div>

          <div className="absolute inset-y-0 left-0 z-[1] hidden w-[54%] bg-[#f7f9fa] md:block" />
          <div className="relative z-10 max-w-[555px] md:pt-14">
            <p className="mb-4 text-sm font-semibold text-[#1a5276]">
              开源 · 可部署 · 可集成
            </p>
            <h1 className="text-4xl font-bold leading-[1.2] text-slate-950 sm:text-5xl md:text-[56px]">
              {config.projectName}
              <span className="mt-2 block text-[#1a5276]">让签署更简单</span>
            </h1>
            <p className="mt-6 max-w-[540px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              把合同发起、内部审批、电子签署和归档放在同一条线上，让业务、法务和管理人员随时看清进度。支持
              H5、小程序、系统集成与私有化部署。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={primaryHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#1a5276] px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#154360]"
              >
                {config.websiteCtaText}
                <ArrowRightIcon className="h-4 w-4" />
              </a>
              <a
                href={demoHref}
                className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-[#1a5276] hover:text-[#1a5276]"
              >
                {demoHref === "#product" ? "查看产品界面" : "观看产品演示"}
              </a>
            </div>
            <div className="mt-7 flex max-w-[210px] flex-col gap-2 text-sm text-slate-600 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
              {["合同全流程", "多端协同", "灵活部署"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-[#1e8449]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="平台特点"
        className="border-b border-slate-200 bg-white"
      >
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 divide-y divide-slate-200 px-4 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-0">
          {[
            {
              icon: DocumentCheckIcon,
              title: "合同流程在线协同",
              desc: "发起、审批、签署、文书与归档",
            },
            {
              icon: DevicePhoneMobileIcon,
              title: "Web 与移动端同步",
              desc: "电脑、H5 与小程序共享业务进度",
            },
            {
              icon: ServerStackIcon,
              title: "开放接口与私有部署",
              desc: "适配企业系统与数据边界",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex min-h-[116px] items-center gap-4 px-4 py-6 md:px-8"
            >
              <item.icon className="h-7 w-7 flex-none text-[#1a5276]" />
              <div>
                <div className="font-semibold text-slate-900">{item.title}</div>
                <div className="mt-1 text-sm leading-5 text-slate-500">
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="capabilities"
        className="bg-[#f9fafb] px-4 py-16 sm:px-8 md:py-24 lg:px-0"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 max-w-[700px]">
            <p className="mb-3 text-sm font-semibold text-[#1a5276]">
              产品能力
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              从发起到归档，关键动作都有明确入口
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              将合同创建、内部审批、电子签署与文书管理放在同一套业务流程中，减少反复沟通和多系统切换。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((item, index) => {
              const Icon = featureIcons[index % featureIcons.length];
              return (
                <article
                  key={item.title}
                  className="min-h-[228px] rounded-lg border border-slate-200 bg-white p-6 shadow-[0_2px_4px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2e86ab] hover:shadow-[0_6px_14px_rgba(0,0,0,0.07)]"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-md ${featureIconStyles[index % featureIconStyles.length]}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                  {item.tags?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-sm bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-8 md:py-24 lg:px-0">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="max-w-[480px]">
            <p className="mb-3 text-sm font-semibold text-[#1e8449]">
              业务价值
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              减少合同流转中的反复确认
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              将关键节点集中在可追踪的线上流程中，帮助业务、法务和管理人员快速确认合同进展。
            </p>
          </div>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {advantages.map((item, index) => {
              const Icon = advantageIcons[index % advantageIcons.length];
              return (
                <article
                  key={item.title}
                  className="flex gap-4 border-t border-slate-200 pt-5"
                >
                  <Icon className="h-6 w-6 flex-none text-[#1e8449]" />
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="product"
        className="bg-[#f9fafb] px-4 py-16 sm:px-8 md:py-24 lg:px-0"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 max-w-[720px]">
            <p className="mb-3 text-sm font-semibold text-[#1a5276]">
              真实产品界面
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              先看产品，再判断是否适合业务
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              通过用户后台与 H5 界面查看合同管理、合同智能能力和移动端业务入口。
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.7fr_0.7fr] lg:items-start">
            <figure>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-[0_4px_10px_rgba(0,0,0,0.06)]">
                <Image
                  src={productImages.web.src}
                  alt={productImages.web.alt}
                  width={1032}
                  height={426}
                  className="h-auto w-full rounded-md"
                />
              </div>
              <figcaption className="mt-3 text-sm text-slate-600">
                用户后台：合同审查、合同比对与合同管理入口
              </figcaption>
            </figure>
            <figure className="mx-auto w-full max-w-[310px] lg:max-w-none">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-[0_4px_10px_rgba(0,0,0,0.06)]">
                <Image
                  src={productImages.mobile.src}
                  alt={productImages.mobile.alt}
                  width={390}
                  height={844}
                  className="h-auto w-full rounded-md"
                  unoptimized
                />
              </div>
              <figcaption className="mt-3 text-sm text-slate-600">
                H5：移动合同入口、合同文书与合同管理
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section
        id="solutions"
        className="border-y border-slate-200 bg-white px-4 py-16 sm:px-8 md:py-24 lg:px-0"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto mb-10 max-w-[680px] text-center">
            <p className="mb-3 text-sm font-semibold text-[#e67e22]">
              解决方案
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              适配常见企业合同场景
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((item, index) => {
              const Icon = industryIcons[index % industryIcons.length];
              return (
                <article
                  key={item.title}
                  className="rounded-lg border border-slate-200 p-5"
                >
                  <Icon className="h-7 w-7 text-[#e67e22]" />
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="delivery"
        className="bg-[#f9fafb] px-4 py-16 sm:px-8 md:py-24 lg:px-0"
      >
        <div className="mx-auto max-w-[1000px]">
          <div className="mx-auto mb-10 max-w-[700px] text-center">
            <p className="mb-3 text-sm font-semibold text-[#1a5276]">
              交付方式
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              按业务复杂度选择系统能力
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              标准使用覆盖日常电子合同业务，旗舰交付进一步支持审批、智能能力、品牌配置与系统集成。
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-5 py-4 font-semibold text-slate-900">
                    功能
                  </th>
                  <th className="px-5 py-4 text-center font-semibold text-slate-900">
                    标准使用
                  </th>
                  <th className="px-5 py-4 text-center font-semibold text-[#1a5276]">
                    旗舰交付
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.feature} className="border-t border-slate-200">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {row.feature}
                    </td>
                    <td className="px-5 py-4 text-center text-slate-600">
                      <CompareValue value={row.standard} />
                    </td>
                    <td className="bg-blue-50/60 px-5 py-4 text-center font-medium text-slate-800">
                      <CompareValue value={row.flagship} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="bg-[#1a5276] px-4 py-16 text-white sm:px-8 md:py-20 lg:px-0"
      >
        <div className="mx-auto flex max-w-[1000px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-[660px]">
            <p className="text-sm font-semibold text-blue-100">
              产品咨询与演示
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
              先确认业务场景，再安排演示与试用
            </h2>
            <p className="mt-4 text-base leading-7 text-blue-50">
              说明合同类型、审批方式、使用终端和部署要求，我们据此确认适合的产品范围与接入方式。
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col">
            <a
              href={contactHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#1a5276] transition-colors duration-200 hover:bg-blue-50"
            >
              <EnvelopeIcon className="h-5 w-5" />
              联系咨询
            </a>
            {userHref ? (
              <a
                href={userHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/50 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
              >
                进入用户平台
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-8 lg:px-0">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-8 border-b border-slate-200 pb-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-[380px]">
              <div className="font-semibold text-slate-900">
                {config.projectName}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                面向企业合同发起、审批、签署、文书与归档的多端业务平台。
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              <a href="#capabilities" className="hover:text-[#1a5276]">
                产品能力
              </a>
              <a href="#product" className="hover:text-[#1a5276]">
                产品界面
              </a>
              <a href="#solutions" className="hover:text-[#1a5276]">
                解决方案
              </a>
              {sourceHref ? (
                <a
                  href={sourceHref}
                  className="inline-flex items-center gap-1.5 hover:text-[#1a5276]"
                >
                  <CodeBracketIcon className="h-4 w-4" />
                  查看源码
                </a>
              ) : null}
              {config.websiteContactEmail ? (
                <a
                  href={`mailto:${config.websiteContactEmail}`}
                  className="hover:text-[#1a5276]"
                >
                  {config.websiteContactEmail}
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} {config.companyName}
            </span>
            {config.icpNo ? <span>{config.icpNo}</span> : null}
          </div>
        </div>
      </footer>
    </main>
  );
}
