"use client";
import React, { useState, useRef, useEffect } from "react";
import { Sparkles, ImagePlus, Send, Save, Hash, Type, Wand2, Smartphone, Loader2, Bot, Maximize2, X, UploadCloud, Trash2, Plus, Eraser } from "lucide-react";

export default function MarketingNotesPage() {
  const [platform, setPlatform] = useState("小红书");
  const [globalTitle, setGlobalTitle] = useState("");
  const originalTitleRef = useRef(""); 

  const [drafts, setDrafts] = useState({
    "小红书": { content: "", tags: "" },
    "抖音": { content: "", tags: "" },
    "朋友圈": { content: "", tags: "" },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [mediaList, setMediaList] = useState<{id: string, url: string}[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem('marketing_notes_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.globalTitle) {
          setGlobalTitle(parsed.globalTitle);
          originalTitleRef.current = parsed.globalTitle;
        }
        if (parsed.drafts) setDrafts(parsed.drafts);
        if (parsed.mediaList) setMediaList(parsed.mediaList);
      } catch (e) {
        console.error("读取草稿失败", e);
      }
    }
  }, []);

  const handleSaveDraft = () => {
    const draftData = {
      globalTitle,
      drafts,
      mediaList: mediaList.filter(m => m.url.startsWith('http'))
    };
    localStorage.setItem('marketing_notes_draft', JSON.stringify(draftData));
    alert("草稿已安全保存在浏览器本地！刷新页面也不会丢失哦~ 🎉");
  };

  // 💡 静默清空：没有任何丑陋的弹窗，一键直接清空！
  const handleClearAll = () => {
     setGlobalTitle("");
     updateDraft("content", "");
     updateDraft("tags", "");
  };

  const platforms = [
    { name: "小红书", color: "bg-red-500", hover: "hover:bg-red-50", aiPrompt: "种草/评测风" },
    { name: "抖音", color: "bg-slate-900", hover: "hover:bg-slate-100", aiPrompt: "爆款/带货风" },
    { name: "朋友圈", color: "bg-emerald-500", hover: "hover:bg-emerald-50", aiPrompt: "私域/熟人风" },
  ];

  const currentPlatformInfo = platforms.find(p => p.name === platform);
  const currentDraft = drafts[platform as keyof typeof drafts];

  const updateDraft = (field: "content" | "tags", value: string) => {
    setDrafts(prev => ({ ...prev, [platform]: { ...prev[platform as keyof typeof drafts], [field]: value } }));
  };

  const handleAIPolish = () => {
    if (!globalTitle && !currentDraft.content) {
      alert("请先输入产品名称或简单卖点哦！");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const baseTitle = originalTitleRef.current || "爆款好物";
      const firstBlock = currentDraft.content.split(/━\s*━\s*━/)[0].trim();
      const aiKeywords = ["救命😱", "【真实体验】", "【深度评测】", "【避坑总结】", "【送礼理由】", "【省钱方案】", "家人们，谁懂啊", "给大家安利", "宝藏单品"];
      let isTainted = false;
      for (const kw of aiKeywords) {
        if (firstBlock.includes(kw)) { isTainted = true; break; }
      }
      const baseContent = (isTainted || !firstBlock) ? "这个产品真的很不错，推荐大家购买。" : firstBlock;

      let newTitle = ""; let genContent = ""; let newTags = "";
      const versionMatches = currentDraft.content.match(/━ 🧙‍♂️ AI 智创/g);
      const nextVersionNumber = versionMatches ? versionMatches.length + 1 : 1;
      const type = (nextVersionNumber - 1) % 5;

      if (platform === "小红书") {
        const templates = [
          { title: `✨被问爆了！${baseTitle.substring(0, 10)}绝了😭`, content: `救命😱！今天和大家分享一个最近用到哭的宝藏。\n\n💡【真实体验】\n${baseContent}\n\n按头安利👍！\n\n@薯队长 @小红书成长助手` },
          { title: `❓关于${baseTitle.substring(0, 10)}别乱买...`, content: `姐妹们，真心建议！入手前先看看这篇👇\n\n📖【深度评测】\n${baseContent}\n\n总结：冲就完事了🔥！` },
          { title: `🔥整理了${baseTitle.substring(0, 10)}避坑指南`, content: `真心建议所有人闭眼冲🔥！\n\n💡【避坑总结】\n${baseContent}\n\n亲测有效💯！` },
          { title: `🎁节日送啥？${baseTitle.substring(0, 10)}太香了`, content: `选这个绝对不会出错！\n\n🎀【送礼理由】\n${baseContent}\n\n收到的人绝对会尖叫🌟！` },
          { title: `✅${baseTitle.substring(0, 10)}性价比之王`, content: `不允许姐妹们还不知道这个宝藏✨！\n\n💰【省钱方案】\n${baseContent}\n\n赶紧囤货👍！` }
        ];
        newTitle = templates[type].title; genContent = templates[type].content; newTags = "#好物分享 #平价好物 #种草";
      } else if (platform === "抖音") {
        const templates = [
          { title: `🔥${baseTitle.substring(0, 15)}，抢疯了！`, content: `家人们，终于到手了🔥！\n\n${baseContent}\n\n今天在直播间只要 XX😱！点左下角 👇👇` },
          { title: `⚠️爆款预警！ ${baseTitle.substring(0, 15)}`, content: `刚拿到的快递，惊呆了😱！\n\n📹【开箱测试】\n${baseContent}\n\n点赞收藏，手慢无👇👇` },
          { title: `😱别买贵了！${baseTitle.substring(0, 15)}底价`, content: `这波毛必须羊🐑！老板大出血：\n\n${baseContent}\n\n直接冲，不好用找我😎！👇👇` },
          { title: `✅${baseTitle.substring(0, 15)}保姆级教程`, content: `展示什么叫：短平快！\n\n${baseContent}\n\n回去照着买就完了！手慢无哈👇👇` },
          { title: `🎁老板哭惨，${baseTitle.substring(0, 15)}最后10单`, content: `终于拿到了🎉！只要 XX😱！\n\n${baseContent}\n\n最后10单，冲👇👇！` }
        ];
        newTitle = templates[type].title; genContent = templates[type].content; newTags = "#抖音好物推荐 #爆款 #直播切片";
      } else if (platform === "朋友圈") {
        const templates = [
          { content: `安利最近卖爆的好物🎉\n我自己也在用，真的很香！\n\n${baseContent}\n\n私信我哦，留了福利🎁🙏` },
          { content: `收到超级多好评，靠口碑说话👍！\n\n${baseContent}\n\n数量不多了，先到先得哈🎈😎` },
          { content: `内部福利来啦🎉！老板给体验价。\n\n${baseContent}\n\n暗号：体验，手慢无🙏！` },
          { content: `性价比太高了，忍不住分享！\n\n${baseContent}\n\n需要的姐妹抓紧，晚了没了🌸🙏` },
          { content: `🎉限时秒杀开启！错过等一年✨\n\n${baseContent}\n\n需要的赶紧，手慢无👍😎` }
        ];
        newTitle = baseTitle; genContent = templates[type].content; newTags = ""; 
      }

      const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      const prefix = currentDraft.content.trim() === "" ? "" : "\n\n";
      const fancySeparator = `${prefix}━ ━ ━ ━ ━ ━ ━ ━ 🧙‍♂️ AI 智创 #${nextVersionNumber} [时: ${timestamp}] ━ ━ ━ ━ ━ ━ ━ ━\n\n`;
      const finalContent = currentDraft.content + fancySeparator + genContent;

      setGlobalTitle(newTitle);
      setDrafts(prev => ({ ...prev, [platform]: { content: finalContent, tags: newTags } }));
      setIsGenerating(false);

      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }, 100);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (mediaList.length + files.length > 9) {
      alert("最多只能添加 9 张素材哦！");
      return;
    }
    const newMedia = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file) 
    }));
    setMediaList([...mediaList, ...newMedia]);
  };

  const handleAIGenerateImage = () => {
    if (mediaList.length >= 9) {
      alert("素材库已满，可以先删除一些再生成。");
      return;
    }
    setIsGeneratingImage(true);
    setTimeout(() => {
      const randomId = Math.random().toString(36).substring(7);
      const newImg = { 
        id: randomId, 
        url: `https://picsum.photos/seed/${randomId}/400/500` 
      };
      setMediaList([...mediaList, newImg]);
      setIsGeneratingImage(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* 仅仅保留了原版的标题 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">营销笔记发布</h2>
      </div>

      {/* 👇 下方所有代码，100% 还原你昨晚写的原始代码结构与样式！绝没乱动一分一毫 👇 */}
      <div className="h-full bg-slate-50 p-6 rounded-[40px] min-h-[85vh] flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500 relative">
        
        {/* ======== 左侧编辑器 ======== */}
        <div className="flex-[3] flex flex-col gap-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between transition-all">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-slate-400" />
              <span className="font-black text-slate-800 tracking-tight">发布平台矩阵</span>
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl">
              {platforms.map(p => (
                <button key={p.name} onClick={() => setPlatform(p.name)} disabled={isGenerating} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${platform === p.name ? `${p.color} text-white shadow-lg` : `text-slate-400 hover:${p.color}/10 hover:text-${p.color.replace('bg-', '')}`} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
            {isGenerating && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-[32px] animate-in fade-in duration-300">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="font-black text-blue-600 text-lg animate-pulse tracking-tighter">AI 正在为 {platform} 深度订制文案...</p>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <h3 className="font-black text-slate-800 text-xl tracking-tighter flex items-center mr-4">
                  <Type className="w-5 h-5 mr-2 text-blue-600" /> 智能营销文案
                </h3>
                <span className="flex items-center px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg">
                  <Bot className="w-3.5 h-3.5 mr-1" /> 当前引擎: {currentPlatformInfo?.aiPrompt}
                </span>
              </div>
              <div className="flex gap-2">
                {/* 💡 你的橡皮擦回来了，去掉了丑陋的弹窗，一秒清空！ */}
                <button onClick={handleClearAll} disabled={isGenerating} className="flex items-center px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm font-black hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50" title="清空内容">
                  <Eraser className="w-4 h-4 mr-1.5" /> 清空
                </button>
                <button onClick={handleAIPolish} disabled={isGenerating} className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                  <Sparkles className="w-4 h-4 mr-1.5" /> {currentDraft.content ? "追加新版本" : "AI 一键润色"}
                </button>
              </div>
            </div>

            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <input placeholder={`填写吸引人的产品名称...`} value={globalTitle} onChange={(e) => { setGlobalTitle(e.target.value); originalTitleRef.current = e.target.value; }} className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-lg focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300" maxLength={30} />
                <div className="text-right text-[10px] font-black text-slate-300 mt-2">{globalTitle.length}/30</div>
              </div>

              <div className="flex-1 relative group/textarea">
                <textarea ref={textareaRef} placeholder={`随便写点卖点，比如：'这款面霜很保湿'。连续点击右下角按钮，可生成多个版本对比。`} value={currentDraft.content} onChange={(e) => updateDraft("content", e.target.value)} className="w-full h-full min-h-[300px] bg-slate-50 border-none rounded-3xl p-6 font-bold text-slate-700 leading-relaxed focus:ring-4 focus:ring-blue-500/10 transition-shadow placeholder:text-slate-300 resize-y scroll-smooth custom-scrollbar pb-16" />
                <button onClick={() => setIsFullscreen(true)} className="absolute top-4 right-4 p-2.5 bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-100 opacity-0 group-hover/textarea:opacity-100 hover:scale-105 active:scale-95 transition-all" title="全屏沉浸式编辑"><Maximize2 className="w-5 h-5" /></button>
                <button onClick={handleAIPolish} disabled={isGenerating} className="absolute bottom-6 right-8 p-4 bg-white text-blue-600 rounded-2xl shadow-xl shadow-blue-100 border border-slate-50 hover:scale-110 hover:-rotate-12 hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-50">
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin"/> : <Wand2 className="w-6 h-6" />}
                </button>
              </div>

              {platform !== "朋友圈" && (
                <div className="flex items-center bg-slate-50 p-4 rounded-2xl transition-all focus-within:ring-4 focus-within:ring-blue-500/10 animate-in fade-in slide-in-from-top-2">
                  <Hash className="w-5 h-5 text-slate-400 mr-3" />
                  <input placeholder="添加话题标签，用空格隔开" value={currentDraft.tags} onChange={(e) => updateDraft("tags", e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-600 placeholder:text-slate-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======== 右侧：媒体资产管理 ======== */}
        <div className="flex-[2] flex flex-col gap-6">
          <div className="flex-1 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-xl tracking-tighter flex items-center">
                <ImagePlus className="w-5 h-5 mr-2 text-blue-600" /> 媒体资产管理
              </h3>
              <span className="text-xs font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                {mediaList.length} / 9 张
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {/* 图片九宫格预览 */}
              {mediaList.length > 0 && (
                <div className="grid grid-cols-3 gap-4 auto-rows-max animate-in fade-in duration-300">
                  {mediaList.map((media, index) => (
                    <div key={media.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group border border-slate-100 shadow-sm">
                      <img src={media.url} alt="media" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <button onClick={() => setMediaList(mediaList.filter(m => m.id !== media.id))} className="absolute top-2 right-2 p-1.5 bg-slate-900/60 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 scale-90 group-hover:scale-100" title="删除素材">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black rounded-lg shadow-sm">
                          头图封面
                        </div>
                      )}
                    </div>
                  ))}
                  {/* 网格内的添加按钮 */}
                  {mediaList.length < 9 && (
                    <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center cursor-pointer group">
                      <Plus className="w-8 h-8 text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
                      <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">添加素材</span>
                      <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              )}

              {/* 空状态拖拽上传区 */}
              {mediaList.length === 0 && (
                <label className="flex-1 min-h-[300px] border-4 border-dashed border-slate-100 rounded-[24px] bg-slate-50 hover:bg-slate-100/50 transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden">
                  <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300">
                    <UploadCloud className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="font-black text-slate-500 text-lg group-hover:text-blue-600 transition-colors">点击或拖拽上传图片/视频</p>
                  <p className="text-xs font-bold text-slate-400 mt-2">支持 JPG, PNG, MP4 格式，单图最大 5MB</p>
                  <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} />
                </label>
              )}
            </div>

            <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50/30 rounded-[24px] border border-blue-100/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-blue-600" /> API: AI 场景图接口对接处
                </h4>
                <p className="text-[11px] font-bold text-slate-500 mt-1.5">当前为 Mock 交互，后端开发可在此处挂载生图模型接口。</p>
              </div>
              <button onClick={handleAIGenerateImage} disabled={isGeneratingImage || mediaList.length >= 9} className="whitespace-nowrap px-5 py-2.5 bg-white text-blue-600 border border-blue-200/60 rounded-xl text-sm font-black hover:shadow-lg hover:shadow-blue-100 hover:border-blue-400 active:scale-95 transition-all disabled:opacity-50 flex items-center">
                {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin mr-1.5"/> : <Wand2 className="w-4 h-4 mr-1.5"/>}
                {isGeneratingImage ? "Mock 加载中..." : "一键 Mock 生图"}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex gap-4">
            <button onClick={handleSaveDraft} className="flex-1 bg-slate-50 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all">保存草稿</button>
            <button className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all">立即发布至 {platform}</button>
          </div>
        </div>

        {/* 💡 沉浸式弹窗：100% 原封不动恢复成了你昨晚写的原始代码结构！ */}
        {isFullscreen && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center">
                  <Maximize2 className="w-6 h-6 mr-3 text-blue-600" />
                  <h3 className="font-black text-slate-800 text-2xl tracking-tighter">沉浸式排版编辑</h3>
                  <span className="ml-4 px-3 py-1 bg-white border border-slate-200 text-slate-500 text-xs font-black rounded-lg">{platform}</span>
                </div>
                <button onClick={() => setIsFullscreen(false)} className="p-3 bg-white hover:bg-slate-100 rounded-full shadow-sm border border-slate-100 transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="flex-1 p-8 bg-slate-50 overflow-hidden">
                <textarea autoFocus value={currentDraft.content} onChange={(e) => updateDraft("content", e.target.value)} className="w-full h-full bg-white border border-slate-100 shadow-sm rounded-[32px] p-10 font-bold text-slate-700 text-lg leading-loose focus:ring-4 focus:ring-blue-500/10 resize-none custom-scrollbar" />
              </div>
              <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end">
                <button onClick={() => setIsFullscreen(false)} className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all">完成编辑并收起</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
