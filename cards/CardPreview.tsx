import React from 'react';
import {CardRenderer} from '../core/CardRenderer';
import {demoTheme} from '../examples/theme-demo/film';

const contentByCard: Record<string, Record<string, unknown>> = {
  'text/keyword-reveal': {text: '一个清晰的观点\n值得被看见', eyebrow: 'TEXT MOTION', accentWord: '看见'},
  'component/stack-reveal': {title: '用秩序建立理解', items: ['先提出一个问题', '再给出视觉证据', '最后留下结论']},
  'media/svg-path': {title: '路径本身就是叙事', steps: ['起点', '探索', '转折', '抵达']},
  'environment/canvas-particles': {text: '情绪，在空间里流动'},
  'component/three-crystal': {text: '为想法建立空间'},
  'text/quote-card': {lines: ['真正的自由', '不是拥有更多选择', '而是知道为何选择'], keywords: ['为何选择'], source: 'MOTION FORGE · 金句卡'},
  'component/number-counter': {label: '年度活跃用户', target: 12800000, suffix: ' 人', delta: '↑ 32%'},
  'text/highlighter-sweep': {heading: '《设计研究》 · 第 42 页', lines: ['好的画面并不依赖更多元素', '真正重要的是视线的秩序', '以及每一次运动都有原因'], highlightIndex: 1},
  'media/pop-in': {images: ['assets/evidence-1.svg', 'assets/evidence-2.svg', 'assets/evidence-3.svg'], labels: ['报告', '访谈', '数据']},
  'environment/flying-words': {words: ['Timeline', 'Keyframes', 'Easing', 'Camera', 'Depth', 'Parallax', 'Motion blur', 'Springs', 'Layers', 'Shot cards', 'Typography', 'Lighting', 'Grain', 'Remotion', 'Beat grid', 'Stagger', 'Transitions', 'Color', 'Workbench', 'Audio sync', 'Storyboard', 'Orbit'], title: '让想法运动起来', eyebrow: 'MOTION FORGE'},
  'transition/push-through': {
    from: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#182234', color: '#f4f0e8', fontSize: 80}}>概念</div>,
    to: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#dce5ef', color: '#182234', fontSize: 80}}>证据</div>,
  },
  'text/typewriter-reveal': {lines: ['上海 · 2026年10月28日', '一次关于画面、节奏与代码的实验']},
  'component/chart-grow': {title: '年度活跃用户（百万）', columns: [{label: '2022', value: 12}, {label: '2023', value: 27}, {label: '2024', value: 45}, {label: '2025', value: 68}, {label: '2026', value: 86}]},
  'media/split-compare': {before: 'assets/evidence-1.svg', after: 'assets/evidence-2.svg', labelBefore: '改造前', labelAfter: '改造后'},
  'component/logo-enter': {brand: 'Motion Forge', tagline: '让每一种想象都有画面'},
  'transition/whip-pan': {
    from: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#182234', color: '#f4f0e8', fontSize: 80}}>此处</div>,
    to: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#dce5ef', color: '#182234', fontSize: 80}}>彼处</div>,
  },
  'text/strike-replace': {prefix: '真正的效率是', from: '做得更多', to: '做得更准', suffix: '。'},
  'component/step-timeline': {steps: [{kicker: '第一步', title: '把目标写成一句话'}, {kicker: '第二步', title: '选择一个视觉母题'}, {kicker: '第三步', title: '让运动服务叙事'}], activeIndex: 1},
  'media/map-route': {cities: [{name: '北京 · 起点', x: 430, y: 150}, {name: '上海 · 中转', x: 612, y: 292}, {name: '深圳 · 抵达', x: 472, y: 458}]},
  'transition/overexpose-flip': {
    from: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#182234', color: '#f4f0e8', fontSize: 80}}>铺垫</div>,
    to: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#dce5ef', color: '#182234', fontSize: 80}}>新章</div>,
  },
  'component/card-fan': {title: '从一张卡，到一套视觉系统', items: [{title: '文字节奏', meta: 'TEXT'}, {title: '数据生长', meta: 'DATA'}, {title: '空间运镜', meta: 'CAMERA'}, {title: '素材叙事', meta: 'MEDIA'}, {title: '连续转场', meta: 'TRANSITION'}], featuredIndex: 2},
  'component/info-term-card': {term: '量化宽松', termEn: 'QE', desc: '央行买入国债等资产，把流动性压进市场，刺激经济。', icon: '¥'},
  'component/bar-chart-growth': {title: '数据说话', bars: [{label: '1月', value: 16}, {label: '2月', value: 23}, {label: '3月', value: 30}, {label: '4月', value: 41}, {label: '5月', value: 52}, {label: '6月', value: 66}, {label: '7月', value: 84}], maxValue: 100, chip: '增长 42%'},
  'component/step-stack': {steps: [{no: '01', txt: '把手机放到另一个房间'}, {no: '02', txt: '只写今天要交的那一件'}, {no: '03', txt: '计时 25 分钟不许起身'}, {no: '04', txt: '做完立刻记一行结果'}]},
  'media/rack-focus': {labels: ['纸书', '电子书']},
  'transition/pullback-cool': {
    from: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#182234', color: '#f4f0e8', fontSize: 80}}>高潮</div>,
    to: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#dce5ef', color: '#182234', fontSize: 80}}>呼吸</div>,
  },
  'media/grid-to-hero': {labels: ['封面候选 ①', '封面候选 ②', '封面候选 ③ · 最终选它', '封面候选 ④'], heroIdx: 2},
  'component/chapter-title': {num: '01', name: '泡沫是怎么吹起来的', sub: 'CHAPTER 01 · 2006—2008'},
  'text/char-rise': {text: '先想清楚，再动手'},
  'text/line-slide': {lines: ['第一，把问题写下来', '第二，只留一个变量', '第三，跑最小实验']},
  'component/metric-sparkline': {label: '本周剪辑效率', target: 67, unit: '%', values: [24, 40, 56, 84], xlabels: ['周一', '周二', '周三', '周四']},
  'component/lower-third': {name: '王砚秋', title: '半导体行业分析师 · 从业 14 年'},
  'transition/black-slam': {
    from: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#182234', color: '#f4f0e8', fontSize: 80}}>悬念</div>,
    to: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#dce5ef', color: '#182234', fontSize: 80}}>答案</div>,
  },
  'text/alt-block-lines': {lines: ['先做减法', '再做加法']},
  'text/count-badge-title': {count: '3', suffix: '个方法', subline: '解决复杂系统的核心瓶颈'},
  'component/hand-drawn-ellipse': {leadText: '要求可以再高一点，但对自己', highlightText: '更松弛一点'},
  'transition/caret-wipe': {
    from: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#151d2a', color: '#8291a7', fontSize: 64, fontWeight: 800}}>旧版代码实现</div>,
    to: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#1e293b', color: '#ffb703', fontSize: 64, fontWeight: 800}}>新版纯代码引擎</div>,
  },
  'transition/shape-wipe': {
    from: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#151d2a', color: '#8291a7', fontSize: 64, fontWeight: 800}}>01 · 概念铺垫</div>,
    to: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#1e293b', color: '#f4f0e8', fontSize: 64, fontWeight: 800}}>02 · 核心高潮</div>,
  },
  'text/keyword-pop-highlight': {prefix: '这家公司一年烧掉', keyword: '300个亿', suffix: '，还在疯狂扩张'},
  'component/callout-line-label': {},
  'component/focus-dim-spotlight': {},
  'component/chat-message-flow': {},
  'component/terminal-typing-log': {},
  'text/color-slam-beat-card': {title: '效率才是唯一的护城河', subtitle: 'SYSTEM PERFORMANCE · 2026'},
  'text/quote-bracket-pull': {lines: ['真正拉开差距的', '从来不是谁更聪明', '而是谁愿意把简单的事重复做'], highlightWord: '重复做'},
  'component/reticle-lock-on': {label: '就是这个按钮', buttonText: '立即开通 ¥ 199 / 年'},
  'transition/particle-weld': {
    from: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#151d2a', color: '#8291a7', fontSize: 64, fontWeight: 800}}>概念解析</div>,
    to: <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#1e293b', color: '#ffb703', fontSize: 64, fontWeight: 800}}>实证落地</div>,
  },
  'component/glass-code-walk': {},
  'component/line-chart-story-draw': {title: '业务假设与增长推演', subtitle: 'SCENARIO FORECAST · 2026'},
  'media/pencil-sketch-draw': {},
  'text/error-retype': {prefix: '做视频靠的不是', first: '堆砌特效', second: '叙事秩序'},
  'text/word-slot-cycle': {stem: '一个 AI，帮你', words: ['写代码', '改简历', '做 PPT', '查资料'], final: '搞定所有事'},
  'text/slab-punch-title': {line1: '找到', line2: '关键破局点'},
  'text/countdown-arc-scatter': {numbers: [11, 10, 9, 8, 7, 6, 5, 4, 3], pick: 5, words: ['分钟', '搭好', '创作系统']},
  'component/unit-grid-proportion': {target: 37, unit: '%', label: ['的核心用户', '在第一分钟产生交互']},
  'component/source-converge': {title: '四个渠道的数据，汇成统一引擎', sources: ['API 网关', '实时日志', '业务数据库', '用户事件'], hub: '统一内核', caption: '自动化全流过滤与清洗'},
  'component/split-60-40-story': {title: ['它一晚上', '干了三件事'], chips: ['读完 40 份行业研报', '生成三版产品交互稿', '完成全链路代码跑测']},
  'component/number-slab-pop': {integer: '23', decimal: '.6', unit: '%', caption: '较去年业务峰值增长'},
  'text/outline-box-title': {boxText: '核心观点', chipText: '在这里'},
  'text/split-text-stagger': {text: '把复杂的事，讲简单', sub: '—— 口播脚本的第一原则'},
  'text/impact-open-title': {mainText: '三秒抓住', accentWord: '核心重点', subtitle: 'OPENING HOOK · 认知颠覆'},
  'component/scribble-annotation': {},
  'text/type-contrast-emphasis': {},
  'component/doc-park-left-pill-deal': {},
  'component/chapter-progress-list': {},
  'component/ui-prop-theater': {},
  'text/lead-word-zoom-assemble': {words: ['效率', '才是', '唯一的', '护城河'], subline: '—— 影视制作自动化工作流'},
  'text/tracking-in': {text: '让每一次运动，都有原因'},
  'text/soft-blur-in': {text: '答案往往没那么复杂'},
  'text/speed-slab-title': {mainTitle: '视频生产效率', subTitle: '提升 10 倍'},
  'media/motion-blur-slam-in': {},
  'media/evidence-scroll-tour': {},
  'media/gallery-wall-dolly': {},
  'camera/tilt-3d-page': {},
  'component/gooey-morph': {},
  'media/still-layout-relay': {},
  'component/claude-code': {promptText: '改 src/theme.ts，加一个深色模式开关'},
  'component/news-card-desk': {},
  'component/info-card-assemble': {},
  'component/stack-fan-out': {title: '我挑选出的 5 套核心设计提案'},
  'component/danmu-bubble-praise': {},
  'text/title-demote-to-label': {title: '全流程代码化落地法则'},
  'component/cursor-actor-demo': {},
  'camera/crash-zoom-punch': {},
  'media/word-relay-filmstrip': {noun: 'Motion Forge 能够', verbs: ['写脚本', '选分镜', '调参数', '秒出片']},
  'component/subscribe-cta': {channelName: 'Motion Forge 官方频道'},
  'media/bed-echo-blur': {title: '竖屏素材同源虚化底床'},
  'text/ink-underline': {},
  'component/chevron-lower-third': {name: '陆逸凡', title: 'AI 视频系统架构师'},
  'text/quote-hold-arrow': {lines: ['大多数人在追求更多的功能', '少数人在思考统一的协议', '而真正的壁垒是极致的确定性']},
  'camera/magnifier-detail': {},
  'transition/line-carry': {},
  'component/scanline-annotate': {},
  'component/chip-grid-single-select': {question: '哪种技术方案真正具备批量交付确定性？', options: ['手动剪辑包装', '调用第三方云模板', '全代码工业化生成', '纯自然语言黑盒生成'], equation: '代码内核 + 可编程参数 = 100% 稳定复现'},
  'media/timeline-photo-strip': {},
  'media/filmstrip-conveyor': {},
  'camera/stage-keyframe-tour': {},
  'component/chat-gpt': {},
  'text/behind-text-title': {bgWord: 'CINEMATIC', frontText: '真正的深度，在前后层次之间'},
  'component/converging-arrows': {textPrefix: '解决复杂系统瓶颈的', focusWord: '核心抓手'},
  'component/corner-bracket-frame': {title: '本期只讲清楚这一件事', subtitle: 'FOCUS FRAMING · 核心论点'},
  'component/douyin-follow-card': {},
  'component/x-follow-card': {},
  'component/host-shrink-to-chip': {},
  'component/parallel-items-with-host': {},
  'camera/cursor-locked-zoom': {},
  'component/host-card-glass-board': {},
  'component/ui-flow-theater': {},
  'transition/long-take-world': {},
  'text/blur-slide': {},
  'text/brace-expand': {},
  'text/paper-title-card': {},
  'text/marker-underline-title': {},
  'text/gradient-word-sweep': {},
  'text/outline-word-fill': {},
  'text/glitch-cycle': {},
  'text/pill-slot-cycle': {},
  'text/text-column-converge': {},
  'text/type-rhythm-sync': {},
  'text/shot-countdown-arc-scatter': {},
  'text/document-typewriter-reveal': {},
  'text/shot-lead-word-zoom-assemble': {},
  'text/pill-chip-slot-cycle-handled': {},
  'text/shot-title-demote-to-label': {},
  'text/type-assembly-moves': {},
  'text/type-entrance-moves': {},
  'text/typewriter-moves': {},
  'text/vertical-word-roll-blur-cycle': {},
  'text/word-relay-filmstrip': {},
  'text/word-relay-geometry': {},
  'camera/basic-3d-scene': {},
  'camera/shot-crash-zoom-punch': {},
  'camera/cursor-flyover': {},
  'camera/depth-layer-moves': {},
  'camera/graze-face-tour': {},
  'camera/overhead-camera-moves': {},
  'camera/space-camera-moves': {},
  'camera/steep-tilt-glide': {},
  'camera/tension-camera-moves': {},
  'camera/terminal-3d': {},
  'component/before-after-slider-scrub': {},
  'component/chart-live-moves': {},
  'component/gauge-readout-moves': {},
  'component/scroll-brake-moves': {},
  'component/timeline-travel': {},
  'component/autolayout-gap-dial': {},
  'component/avatar-bracket-carousel': {},
  'component/bezier-source-converge-merge': {},
  'component/canvas-materialize-moves': {},
  'component/carousel-3d': {},
  'component/chip-grid-single-select-blackout': {},
  'component/cloner-depth-echo': {},
  'component/collab-cursor-moves': {},
  'component/deck-deal-flyin': {},
  'component/shot-doc-park-left-pill-deal': {},
  'component/draw-svg-trace': {},
  'component/element-body-moves': {},
  'component/glass-pill-dictation-typing': {},
  'component/hashtag-to-pill-materialize': {},
  'component/integration-hub-map': {},
  'component/list-reveal': {},
  'component/list-stack-press': {},
  'component/neon-frame-forerun': {},
  'component/neon-frame-orbit-drop': {},
  'component/page-waterfall-wall': {},
  'component/picker-carousel-feature-cycle': {},
  'component/product-card-progressive-assemble': {},
  'component/radial-wave': {},
  'component/research-card-stack-scroll': {},
  'component/row-embed': {},
  'component/segmented-thumb-hero': {},
  'component/theme-switch-moves': {},
  'component/type-and-filter': {},
  'component/value-stagger-gradient': {},
  'component/voice-waveform-live': {},
  'component/wall-reveal-moves': {},
  'component/assemble-then-type-flyin': {},
  'component/aurora-bloom-bg-flip': {},
  'component/brand-frame-snap': {},
  'component/fui-hud-moves': {},
  'component/glow-flyline-moves': {},
  'component/icon-performance-moves': {},
  'component/impact-feedback': {},
  'component/light-play-moves': {},
  'component/radial-ripple-phone-chips': {},
  'component/riso-print-hits': {},
  'component/scan-bracket-sweep': {},
  'component/scanline-annotate-focus': {},
  'component/scanline-assemble-flyin': {},
  'component/slam-entrance-moves': {},
  'component/spotlight-sweep-moves': {},
  'component/beat-cut-moves': {},
  'component/beat-step-list-theme-cycle': {},
  'component/panel-grid-moves': {},
  'component/quad-split-parallel-scenes': {},
  'component/rhythm-interrupt-moves': {},
  'component/sakuga-timing-shift': {},
  'component/speed-ramp-freeze': {},
  'component/trailer-grammar-moves': {},
  'transition/bottom-push-stack-wipe': {},
  'transition/card-flip-reveal': {},
  'transition/card-flock-tumble': {},
  'transition/circle-match-iris': {},
  'transition/gradient-transition': {},
  'transition/line-carry-transition': {},
  'transition/mosaic-reframe': {},
  'transition/page-turn-transitions': {},
  'transition/print-texture-transitions': {},
  'transition/shot-transitions': {},
  'transition/tear-streak-transitions': {},
  'transition/transition-hidden-cut': {},
  'transition/transition-travel': {},
  'transition/white-flash-logo-simplify-cut': {},
  'transition/wipe-transitions': {},
  'component/brand-ink-open': {},
  'component/crane-rise-reveal': {},
  'component/dataviz-landscape-open': {},
  'component/fracture': {},
  'component/icon-field-colorize': {},
  'component/letterspace-materialize': {},
  'component/magician-card-flourish': {},
  'component/orbit-ring-title-open': {},
  'component/spotlight-hero-card': {},
  'component/stroke-segment-build': {},
  'component/text-as-mask': {},
  'component/grain-dissolve': {},
  'component/logo-shrink-wordmark-lockup': {},
  'component/neon-triple-marquee': {},
  'component/outro-group-photo-launch': {},
  'component/ui-strip-away-outro': {},
  'component/ui-to-brand-morph': {},
  'component/hook': {},
  'component/chat': {},
  'component/phone': {},
  'component/mock-app': {},
  'component/meter': {},
  'component/compare': {},
  'component/counter': {},
  'component/data-chart': {},
  'component/features': {},
  'component/steps': {},
  'component/quick-list': {},
  'component/end-card': {},
  'component/photo-shot': {},
  'component/price-card': {},
  'component/store-card': {},
  'component/review-card': {},
  'component/fact-sheet': {},
  'component/cred-card': {},
  'component/before-after': {},
  'camera/dolly-zoom': {},
  'component/particle-sand-fill': {},
  'text/split-flap-flip': {text: 'MOTION FORGE'},
  'component/counter-confetti': {target: 10000000, label: 'TEN MILLION USERS'},
  'text/scramble-decode': {text: 'AI CODE GENERATE'},
  'transition/cube-rotate': {},
  'component/popup-book-rise': {},
  'component/masking-tape-slap': {title: '观点在此立定', subtitle: 'PAPERCRAFT AND TAPE'},
  'component/command-palette-summon': {},
  'text/halation-bloom': {text: '10x'},
};

const kpis = [
  {label: '日活跃用户', value: '1,284,900', delta: '↑ 12.4%', lead: true},
  {label: '播放完成率', value: '68.2%', delta: '↑ 3.1%', lead: false},
  {label: '新增订阅', value: '24,318', delta: '↑ 8.7%', lead: false},
  {label: '平均停留', value: '04:32', delta: '↓ 0.4%', lead: false},
];

const bars = [38, 52, 44, 66, 58, 74, 69, 82, 77, 90, 85, 96];

const rows = [
  {name: '首页推荐流', value: '46%'},
  {name: '搜索进入', value: '27%'},
  {name: '分享裂变', value: '18%'},
  {name: '其他渠道', value: '9%'},
];

// 静态看板：相机类动效卡的预览内容。自身不带动画，运动全部来自相机卡，
// 避免嵌套带入场动画的内容卡导致"看起来不是同一个动效"的误判。
export const StaticBoard: React.FC = () => (
  <div style={{width: '100%', height: '100%', background: demoTheme.background, color: demoTheme.foreground, fontFamily: demoTheme.fontFamily, position: 'relative'}}>
    <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 44, display: 'flex', alignItems: 'center', padding: '0 40px', borderBottom: `1px solid ${demoTheme.muted}33`, gap: 12}}>
      <div style={{width: 12, height: 12, borderRadius: 3, background: demoTheme.accent}} />
      <div style={{fontSize: 17, fontWeight: 700}}>运营数据看板</div>
      <div style={{marginLeft: 'auto', display: 'flex', gap: 10}}>
        {['实时', '近 7 天', '导出'].map((tag) => (
          <div key={tag} style={{fontSize: 12, color: demoTheme.muted, border: `1px solid ${demoTheme.muted}55`, borderRadius: 20, padding: '3px 12px'}}>{tag}</div>
        ))}
      </div>
    </div>
    {kpis.map((kpi, index) => (
      <div key={kpi.label} style={{
        position: 'absolute', left: 40 + index * 224, top: 64, width: 208, height: 110,
        background: '#141b29', borderRadius: 10, padding: '16px 18px', boxSizing: 'border-box',
        border: kpi.lead ? `2px solid ${demoTheme.accent}` : `1px solid ${demoTheme.muted}33`,
      }}>
        <div style={{fontSize: 13, color: demoTheme.muted}}>{kpi.label}</div>
        <div style={{fontSize: 30, fontWeight: 800, marginTop: 8, color: kpi.lead ? demoTheme.accent : demoTheme.foreground}}>{kpi.value}</div>
        <div style={{fontSize: 12, color: kpi.delta.startsWith('↑') ? '#4ecb71' : '#e06c60', marginTop: 6}}>{kpi.delta} 较昨日</div>
      </div>
    ))}
    <div style={{position: 'absolute', left: 40, top: 196, width: 560, height: 220, background: '#141b29', borderRadius: 10, border: `1px solid ${demoTheme.muted}33`, padding: '14px 18px', boxSizing: 'border-box'}}>
      <div style={{fontSize: 13, color: demoTheme.muted}}>逐日活跃趋势</div>
      <div style={{position: 'absolute', left: 18, right: 18, bottom: 16, top: 44, display: 'flex', alignItems: 'flex-end', gap: 12}}>
        {bars.map((height, i) => (
          <div key={i} style={{flex: 1, height: `${height}%`, background: i === bars.length - 1 ? demoTheme.accent : '#2c3a52', borderRadius: '3px 3px 0 0'}} />
        ))}
      </div>
    </div>
    <div style={{position: 'absolute', left: 616, top: 196, width: 304, height: 220, background: '#141b29', borderRadius: 10, border: `1px solid ${demoTheme.muted}33`, padding: '14px 18px', boxSizing: 'border-box'}}>
      <div style={{fontSize: 13, color: demoTheme.muted, marginBottom: 10}}>流量来源</div>
      {rows.map((row) => (
        <div key={row.name} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${demoTheme.muted}22`, fontSize: 13}}>
          <div style={{width: 8, height: 8, borderRadius: 4, background: demoTheme.accent}} />
          <div>{row.name}</div>
          <div style={{marginLeft: 'auto', color: demoTheme.muted}}>{row.value}</div>
        </div>
      ))}
    </div>
    <div style={{position: 'absolute', left: 40, top: 440, width: 880, height: 60, background: '#141b29', borderRadius: 10, border: `1px solid ${demoTheme.muted}33`, display: 'flex', alignItems: 'center', padding: '0 24px', boxSizing: 'border-box', gap: 40, fontSize: 13, color: demoTheme.muted}}>
      <span>峰值并发 <b style={{color: demoTheme.foreground}}>8,412</b></span>
      <span>服务器区域 <b style={{color: demoTheme.foreground}}>华东 · 华南</b></span>
      <span>数据更新于 <b style={{color: demoTheme.accent}}>10 秒前</b></span>
    </div>
  </div>
);

// 看板 POI：首张带 accent 边框的 KPI 卡中心 (144, 119)。
// slow-pull 起手要咬住它：t = -s·p，p 是 POI 相对画心 (480,270) 的偏移 (-336,-151)。

export type CardPreviewProps = {
  cardId: string;
  durationInFrames: number;
  params?: Record<string, unknown>;
};

export const CardPreview: React.FC<CardPreviewProps> = ({cardId, durationInFrames, params: extraParams}) => {
  if (cardId === 'camera/sway-parallax') {
    return (
      <CardRenderer cardId={cardId} theme={demoTheme} durationInFrames={durationInFrames} params={extraParams}>
        <div style={{display: 'flex', width: '100%', height: '100%', background: demoTheme.background, color: demoTheme.foreground, fontFamily: demoTheme.fontFamily}}>
          {['提出一个问题', '建立视觉证据', '让运动服务叙事', '留下清晰结论'].map((text, index) => (
            <div key={text} style={{width: '25%', padding: '80px 45px', borderRight: `1px solid ${demoTheme.muted}`}}>
              <div style={{color: demoTheme.accent, fontSize: 22, marginBottom: 30}}>0{index + 1}</div>
              <div style={{fontSize: 44, fontWeight: 750, lineHeight: 1.3}}>{text}</div>
              <div style={{height: 8, background: demoTheme.muted, marginTop: 45, opacity: 0.45}} />
            </div>
          ))}
        </div>
      </CardRenderer>
    );
  }
  if (
    cardId === 'camera/slow-push' ||
    cardId === 'camera/slow-pull' ||
    cardId === 'camera/orbit-drift' ||
    cardId === 'camera/pip-zoom-box' ||
    cardId === 'camera/tilt-3d-page' ||
    cardId === 'camera/crash-zoom-punch' ||
    cardId === 'camera/magnifier-detail' ||
    cardId === 'camera/stage-keyframe-tour' ||
    cardId === 'camera/cursor-locked-zoom'
  ) {
    const baseParams = cardId === 'camera/slow-push'
      ? {zoomTo: 1.1, originX: 15, originY: 22, driftX: -13, driftY: -7, ...extraParams}
      : cardId === 'camera/slow-pull'
        ? {zoomFrom: 1.26, startX: 336, startY: 151, ...extraParams}
        : cardId === 'camera/orbit-drift'
          ? {orbit: 5.6, ampRotY: 6.2, ...extraParams}
          : cardId === 'camera/pip-zoom-box'
            ? {zoom: 2.2, flyDur: 0.5, ...extraParams}
            : extraParams;
    return (
      <CardRenderer cardId={cardId} theme={demoTheme} durationInFrames={durationInFrames} params={baseParams}>
        <StaticBoard />
      </CardRenderer>
    );
  }
  return (
    <CardRenderer
      cardId={cardId}
      theme={demoTheme}
      durationInFrames={durationInFrames}
      params={{...(contentByCard[cardId] ?? {}), ...(extraParams ?? {})}}
    />
  );
};
