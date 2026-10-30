import type {MotionCardDefinition} from '../core/card';
import {motionCardManifestSchema} from '../core/schema';

import camera_basic_3d_scene_Manifest from './camera/basic-3d-scene/card.json';
import {Basic3dScene} from './camera/basic-3d-scene';
import camera_crash_zoom_punch_Manifest from './camera/crash-zoom-punch/card.json';
import {CrashZoomPunch} from './camera/crash-zoom-punch';
import camera_cursor_flyover_Manifest from './camera/cursor-flyover/card.json';
import {CursorFlyover} from './camera/cursor-flyover';
import camera_cursor_locked_zoom_Manifest from './camera/cursor-locked-zoom/card.json';
import {CursorLockedZoom} from './camera/cursor-locked-zoom';
import camera_depth_layer_moves_Manifest from './camera/depth-layer-moves/card.json';
import {DepthLayerMoves} from './camera/depth-layer-moves';
import camera_dolly_zoom_Manifest from './camera/dolly-zoom/card.json';
import {DollyZoom} from './camera/dolly-zoom';
import camera_graze_face_tour_Manifest from './camera/graze-face-tour/card.json';
import {GrazeFaceTour} from './camera/graze-face-tour';
import camera_magnifier_detail_Manifest from './camera/magnifier-detail/card.json';
import {MagnifierDetail} from './camera/magnifier-detail';
import camera_orbit_drift_Manifest from './camera/orbit-drift/card.json';
import {OrbitDrift} from './camera/orbit-drift';
import camera_overhead_camera_moves_Manifest from './camera/overhead-camera-moves/card.json';
import {OverheadCameraMoves} from './camera/overhead-camera-moves';
import camera_pip_zoom_box_Manifest from './camera/pip-zoom-box/card.json';
import {PipZoomBox} from './camera/pip-zoom-box';
import camera_shot_crash_zoom_punch_Manifest from './camera/shot-crash-zoom-punch/card.json';
import {ShotCrashZoomPunch} from './camera/shot-crash-zoom-punch';
import camera_slow_pull_Manifest from './camera/slow-pull/card.json';
import {SlowPull} from './camera/slow-pull';
import camera_slow_push_Manifest from './camera/slow-push/card.json';
import {SlowPush} from './camera/slow-push';
import camera_space_camera_moves_Manifest from './camera/space-camera-moves/card.json';
import {SpaceCameraMoves} from './camera/space-camera-moves';
import camera_stage_keyframe_tour_Manifest from './camera/stage-keyframe-tour/card.json';
import {StageKeyframeTour} from './camera/stage-keyframe-tour';
import camera_steep_tilt_glide_Manifest from './camera/steep-tilt-glide/card.json';
import {SteepTiltGlide} from './camera/steep-tilt-glide';
import camera_sway_parallax_Manifest from './camera/sway-parallax/card.json';
import {SwayParallax} from './camera/sway-parallax';
import camera_tension_camera_moves_Manifest from './camera/tension-camera-moves/card.json';
import {TensionCameraMoves} from './camera/tension-camera-moves';
import camera_terminal_3d_Manifest from './camera/terminal-3d/card.json';
import {Terminal3d} from './camera/terminal-3d';
import camera_tilt_3d_page_Manifest from './camera/tilt-3d-page/card.json';
import {Tilt3dPage} from './camera/tilt-3d-page';
import typography_alt_block_lines_Manifest from './typography/alt-block-lines/card.json';
import {AltBlockLines} from './typography/alt-block-lines';
import typography_behind_text_title_Manifest from './typography/behind-text-title/card.json';
import {BehindTextTitle} from './typography/behind-text-title';
import typography_blur_slide_Manifest from './typography/blur-slide/card.json';
import {BlurSlide} from './typography/blur-slide';
import typography_brace_expand_Manifest from './typography/brace-expand/card.json';
import {BraceExpand} from './typography/brace-expand';
import typography_char_rise_Manifest from './typography/char-rise/card.json';
import {CharRise} from './typography/char-rise';
import typography_color_slam_beat_card_Manifest from './typography/color-slam-beat-card/card.json';
import {ColorSlamBeatCard} from './typography/color-slam-beat-card';
import typography_count_badge_title_Manifest from './typography/count-badge-title/card.json';
import {CountBadgeTitle} from './typography/count-badge-title';
import typography_countdown_arc_scatter_Manifest from './typography/countdown-arc-scatter/card.json';
import {CountdownArcScatter} from './typography/countdown-arc-scatter';
import typography_document_typewriter_reveal_Manifest from './typography/document-typewriter-reveal/card.json';
import {DocumentTypewriterReveal} from './typography/document-typewriter-reveal';
import typography_error_retype_Manifest from './typography/error-retype/card.json';
import {ErrorRetype} from './typography/error-retype';
import typography_glitch_cycle_Manifest from './typography/glitch-cycle/card.json';
import {GlitchCycle} from './typography/glitch-cycle';
import typography_gradient_word_sweep_Manifest from './typography/gradient-word-sweep/card.json';
import {GradientWordSweep} from './typography/gradient-word-sweep';
import typography_halation_bloom_Manifest from './typography/halation-bloom/card.json';
import {HalationBloom} from './typography/halation-bloom';
import typography_highlighter_sweep_Manifest from './typography/highlighter-sweep/card.json';
import {HighlighterSweep} from './typography/highlighter-sweep';
import typography_impact_open_title_Manifest from './typography/impact-open-title/card.json';
import {ImpactOpenTitle} from './typography/impact-open-title';
import typography_ink_underline_Manifest from './typography/ink-underline/card.json';
import {InkUnderline} from './typography/ink-underline';
import typography_keyword_pop_highlight_Manifest from './typography/keyword-pop-highlight/card.json';
import {KeywordPopHighlight} from './typography/keyword-pop-highlight';
import typography_keyword_reveal_Manifest from './typography/keyword-reveal/card.json';
import {KeywordReveal} from './typography/keyword-reveal';
import typography_lead_word_zoom_assemble_Manifest from './typography/lead-word-zoom-assemble/card.json';
import {LeadWordZoomAssemble} from './typography/lead-word-zoom-assemble';
import typography_line_slide_Manifest from './typography/line-slide/card.json';
import {LineSlide} from './typography/line-slide';
import typography_marker_underline_title_Manifest from './typography/marker-underline-title/card.json';
import {MarkerUnderlineTitle} from './typography/marker-underline-title';
import typography_outline_box_title_Manifest from './typography/outline-box-title/card.json';
import {OutlineBoxTitle} from './typography/outline-box-title';
import typography_outline_word_fill_Manifest from './typography/outline-word-fill/card.json';
import {OutlineWordFill} from './typography/outline-word-fill';
import typography_paper_title_card_Manifest from './typography/paper-title-card/card.json';
import {PaperTitleCard} from './typography/paper-title-card';
import typography_pill_chip_slot_cycle_handled_Manifest from './typography/pill-chip-slot-cycle-handled/card.json';
import {PillChipSlotCycleHandled} from './typography/pill-chip-slot-cycle-handled';
import typography_pill_slot_cycle_Manifest from './typography/pill-slot-cycle/card.json';
import {PillSlotCycle} from './typography/pill-slot-cycle';
import typography_quote_bracket_pull_Manifest from './typography/quote-bracket-pull/card.json';
import {QuoteBracketPull} from './typography/quote-bracket-pull';
import typography_quote_card_Manifest from './typography/quote-card/card.json';
import {QuoteCard} from './typography/quote-card';
import typography_quote_hold_arrow_Manifest from './typography/quote-hold-arrow/card.json';
import {QuoteHoldArrow} from './typography/quote-hold-arrow';
import typography_scramble_decode_Manifest from './typography/scramble-decode/card.json';
import {ScrambleDecode} from './typography/scramble-decode';
import typography_shot_countdown_arc_scatter_Manifest from './typography/shot-countdown-arc-scatter/card.json';
import {ShotCountdownArcScatter} from './typography/shot-countdown-arc-scatter';
import typography_shot_lead_word_zoom_assemble_Manifest from './typography/shot-lead-word-zoom-assemble/card.json';
import {ShotLeadWordZoomAssemble} from './typography/shot-lead-word-zoom-assemble';
import typography_shot_title_demote_to_label_Manifest from './typography/shot-title-demote-to-label/card.json';
import {ShotTitleDemoteToLabel} from './typography/shot-title-demote-to-label';
import typography_slab_punch_title_Manifest from './typography/slab-punch-title/card.json';
import {SlabPunchTitle} from './typography/slab-punch-title';
import typography_soft_blur_in_Manifest from './typography/soft-blur-in/card.json';
import {SoftBlurIn} from './typography/soft-blur-in';
import typography_speed_slab_title_Manifest from './typography/speed-slab-title/card.json';
import {SpeedSlabTitle} from './typography/speed-slab-title';
import typography_split_flap_flip_Manifest from './typography/split-flap-flip/card.json';
import {SplitFlapFlip} from './typography/split-flap-flip';
import typography_split_text_stagger_Manifest from './typography/split-text-stagger/card.json';
import {SplitTextStagger} from './typography/split-text-stagger';
import typography_strike_replace_Manifest from './typography/strike-replace/card.json';
import {StrikeReplace} from './typography/strike-replace';
import typography_text_column_converge_Manifest from './typography/text-column-converge/card.json';
import {TextColumnConverge} from './typography/text-column-converge';
import typography_title_demote_to_label_Manifest from './typography/title-demote-to-label/card.json';
import {TitleDemoteToLabel} from './typography/title-demote-to-label';
import typography_tracking_in_Manifest from './typography/tracking-in/card.json';
import {TrackingIn} from './typography/tracking-in';
import typography_type_assembly_moves_Manifest from './typography/type-assembly-moves/card.json';
import {TypeAssemblyMoves} from './typography/type-assembly-moves';
import typography_type_contrast_emphasis_Manifest from './typography/type-contrast-emphasis/card.json';
import {TypeContrastEmphasis} from './typography/type-contrast-emphasis';
import typography_type_entrance_moves_Manifest from './typography/type-entrance-moves/card.json';
import {TypeEntranceMoves} from './typography/type-entrance-moves';
import typography_type_rhythm_sync_Manifest from './typography/type-rhythm-sync/card.json';
import {TypeRhythmSync} from './typography/type-rhythm-sync';
import typography_typewriter_moves_Manifest from './typography/typewriter-moves/card.json';
import {TypewriterMoves} from './typography/typewriter-moves';
import typography_typewriter_reveal_Manifest from './typography/typewriter-reveal/card.json';
import {TypewriterReveal} from './typography/typewriter-reveal';
import typography_vertical_word_roll_blur_cycle_Manifest from './typography/vertical-word-roll-blur-cycle/card.json';
import {VerticalWordRollBlurCycle} from './typography/vertical-word-roll-blur-cycle';
import typography_word_relay_filmstrip_Manifest from './typography/word-relay-filmstrip/card.json';
import {WordRelayFilmstrip as ShotTextWordRelayFilmstrip} from './typography/word-relay-filmstrip';
import typography_word_relay_geometry_Manifest from './typography/word-relay-geometry/card.json';
import {WordRelayGeometry} from './typography/word-relay-geometry';
import typography_word_slot_cycle_Manifest from './typography/word-slot-cycle/card.json';
import {WordSlotCycle} from './typography/word-slot-cycle';
import data_bar_chart_growth_Manifest from './data/bar-chart-growth/card.json';
import {BarChartGrowth} from './data/bar-chart-growth';
import data_before_after_slider_scrub_Manifest from './data/before-after-slider-scrub/card.json';
import {BeforeAfterSliderScrub} from './data/before-after-slider-scrub';
import data_chart_grow_Manifest from './data/chart-grow/card.json';
import {ChartGrow} from './data/chart-grow';
import data_chart_live_moves_Manifest from './data/chart-live-moves/card.json';
import {ChartLiveMoves} from './data/chart-live-moves';
import data_chip_grid_single_select_Manifest from './data/chip-grid-single-select/card.json';
import {ChipGridSingleSelect} from './data/chip-grid-single-select';
import data_counter_confetti_Manifest from './data/counter-confetti/card.json';
import {CounterConfetti} from './data/counter-confetti';
import data_gauge_readout_moves_Manifest from './data/gauge-readout-moves/card.json';
import {GaugeReadoutMoves} from './data/gauge-readout-moves';
import data_info_term_card_Manifest from './data/info-term-card/card.json';
import {InfoTermCard} from './data/info-term-card';
import data_line_chart_story_draw_Manifest from './data/line-chart-story-draw/card.json';
import {LineChartStoryDraw} from './data/line-chart-story-draw';
import data_metric_sparkline_Manifest from './data/metric-sparkline/card.json';
import {MetricSparkline} from './data/metric-sparkline';
import data_number_counter_Manifest from './data/number-counter/card.json';
import {NumberCounter} from './data/number-counter';
import data_number_slab_pop_Manifest from './data/number-slab-pop/card.json';
import {NumberSlabPop} from './data/number-slab-pop';
import data_particle_sand_fill_Manifest from './data/particle-sand-fill/card.json';
import {ParticleSandFill} from './data/particle-sand-fill';
import data_scroll_brake_moves_Manifest from './data/scroll-brake-moves/card.json';
import {ScrollBrakeMoves} from './data/scroll-brake-moves';
import data_source_converge_Manifest from './data/source-converge/card.json';
import {SourceConverge} from './data/source-converge';
import data_step_stack_Manifest from './data/step-stack/card.json';
import {StepStack} from './data/step-stack';
import data_step_timeline_Manifest from './data/step-timeline/card.json';
import {StepTimeline} from './data/step-timeline';
import data_timeline_travel_Manifest from './data/timeline-travel/card.json';
import {TimelineTravel} from './data/timeline-travel';
import data_ui_prop_theater_Manifest from './data/ui-prop-theater/card.json';
import {UiPropTheater} from './data/ui-prop-theater';
import data_unit_grid_proportion_Manifest from './data/unit-grid-proportion/card.json';
import {UnitGridProportion} from './data/unit-grid-proportion';
import interaction_autolayout_gap_dial_Manifest from './interaction/autolayout-gap-dial/card.json';
import {AutolayoutGapDial} from './interaction/autolayout-gap-dial';
import interaction_avatar_bracket_carousel_Manifest from './interaction/avatar-bracket-carousel/card.json';
import {AvatarBracketCarousel} from './interaction/avatar-bracket-carousel';
import interaction_bezier_source_converge_merge_Manifest from './interaction/bezier-source-converge-merge/card.json';
import {BezierSourceConvergeMerge} from './interaction/bezier-source-converge-merge';
import interaction_callout_line_label_Manifest from './interaction/callout-line-label/card.json';
import {CalloutLineLabel} from './interaction/callout-line-label';
import interaction_canvas_materialize_moves_Manifest from './interaction/canvas-materialize-moves/card.json';
import {CanvasMaterializeMoves} from './interaction/canvas-materialize-moves';
import interaction_card_fan_Manifest from './interaction/card-fan/card.json';
import {CardFan} from './interaction/card-fan';
import interaction_carousel_3d_Manifest from './interaction/carousel-3d/card.json';
import {Carousel3d} from './interaction/carousel-3d';
import interaction_chat_gpt_Manifest from './interaction/chat-gpt/card.json';
import {ChatGpt} from './interaction/chat-gpt';
import interaction_chat_message_flow_Manifest from './interaction/chat-message-flow/card.json';
import {ChatMessageFlow} from './interaction/chat-message-flow';
import interaction_chip_grid_single_select_blackout_Manifest from './interaction/chip-grid-single-select-blackout/card.json';
import {ChipGridSingleSelectBlackout} from './interaction/chip-grid-single-select-blackout';
import interaction_claude_code_Manifest from './interaction/claude-code/card.json';
import {ClaudeCode} from './interaction/claude-code';
import interaction_cloner_depth_echo_Manifest from './interaction/cloner-depth-echo/card.json';
import {ClonerDepthEcho} from './interaction/cloner-depth-echo';
import interaction_collab_cursor_moves_Manifest from './interaction/collab-cursor-moves/card.json';
import {CollabCursorMoves} from './interaction/collab-cursor-moves';
import interaction_command_palette_summon_Manifest from './interaction/command-palette-summon/card.json';
import {CommandPaletteSummon} from './interaction/command-palette-summon';
import interaction_cursor_actor_demo_Manifest from './interaction/cursor-actor-demo/card.json';
import {CursorActorDemo} from './interaction/cursor-actor-demo';
import interaction_danmu_bubble_praise_Manifest from './interaction/danmu-bubble-praise/card.json';
import {DanmuBubblePraise} from './interaction/danmu-bubble-praise';
import interaction_deck_deal_flyin_Manifest from './interaction/deck-deal-flyin/card.json';
import {DeckDealFlyin} from './interaction/deck-deal-flyin';
import interaction_doc_park_left_pill_deal_Manifest from './interaction/doc-park-left-pill-deal/card.json';
import {DocParkLeftPillDeal} from './interaction/doc-park-left-pill-deal';
import interaction_draw_svg_trace_Manifest from './interaction/draw-svg-trace/card.json';
import {DrawSvgTrace} from './interaction/draw-svg-trace';
import interaction_element_body_moves_Manifest from './interaction/element-body-moves/card.json';
import {ElementBodyMoves} from './interaction/element-body-moves';
import interaction_glass_code_walk_Manifest from './interaction/glass-code-walk/card.json';
import {GlassCodeWalk} from './interaction/glass-code-walk';
import interaction_glass_pill_dictation_typing_Manifest from './interaction/glass-pill-dictation-typing/card.json';
import {GlassPillDictationTyping} from './interaction/glass-pill-dictation-typing';
import interaction_gooey_morph_Manifest from './interaction/gooey-morph/card.json';
import {GooeyMorph} from './interaction/gooey-morph';
import interaction_hand_drawn_ellipse_Manifest from './interaction/hand-drawn-ellipse/card.json';
import {HandDrawnEllipse} from './interaction/hand-drawn-ellipse';
import interaction_hashtag_to_pill_materialize_Manifest from './interaction/hashtag-to-pill-materialize/card.json';
import {HashtagToPillMaterialize} from './interaction/hashtag-to-pill-materialize';
import interaction_host_card_glass_board_Manifest from './interaction/host-card-glass-board/card.json';
import {HostCardGlassBoard} from './interaction/host-card-glass-board';
import interaction_host_shrink_to_chip_Manifest from './interaction/host-shrink-to-chip/card.json';
import {HostShrinkToChip} from './interaction/host-shrink-to-chip';
import interaction_info_card_assemble_Manifest from './interaction/info-card-assemble/card.json';
import {InfoCardAssemble} from './interaction/info-card-assemble';
import interaction_integration_hub_map_Manifest from './interaction/integration-hub-map/card.json';
import {IntegrationHubMap} from './interaction/integration-hub-map';
import interaction_list_reveal_Manifest from './interaction/list-reveal/card.json';
import {ListReveal} from './interaction/list-reveal';
import interaction_list_stack_press_Manifest from './interaction/list-stack-press/card.json';
import {ListStackPress} from './interaction/list-stack-press';
import interaction_masking_tape_slap_Manifest from './interaction/masking-tape-slap/card.json';
import {MaskingTapeSlap} from './interaction/masking-tape-slap';
import interaction_neon_frame_forerun_Manifest from './interaction/neon-frame-forerun/card.json';
import {NeonFrameForerun} from './interaction/neon-frame-forerun';
import interaction_neon_frame_orbit_drop_Manifest from './interaction/neon-frame-orbit-drop/card.json';
import {NeonFrameOrbitDrop} from './interaction/neon-frame-orbit-drop';
import interaction_news_card_desk_Manifest from './interaction/news-card-desk/card.json';
import {NewsCardDesk} from './interaction/news-card-desk';
import interaction_page_waterfall_wall_Manifest from './interaction/page-waterfall-wall/card.json';
import {PageWaterfallWall} from './interaction/page-waterfall-wall';
import interaction_parallel_items_with_host_Manifest from './interaction/parallel-items-with-host/card.json';
import {ParallelItemsWithHost} from './interaction/parallel-items-with-host';
import interaction_picker_carousel_feature_cycle_Manifest from './interaction/picker-carousel-feature-cycle/card.json';
import {PickerCarouselFeatureCycle} from './interaction/picker-carousel-feature-cycle';
import interaction_popup_book_rise_Manifest from './interaction/popup-book-rise/card.json';
import {PopupBookRise} from './interaction/popup-book-rise';
import interaction_product_card_progressive_assemble_Manifest from './interaction/product-card-progressive-assemble/card.json';
import {ProductCardProgressiveAssemble} from './interaction/product-card-progressive-assemble';
import interaction_radial_wave_Manifest from './interaction/radial-wave/card.json';
import {RadialWave} from './interaction/radial-wave';
import interaction_research_card_stack_scroll_Manifest from './interaction/research-card-stack-scroll/card.json';
import {ResearchCardStackScroll} from './interaction/research-card-stack-scroll';
import interaction_row_embed_Manifest from './interaction/row-embed/card.json';
import {RowEmbed} from './interaction/row-embed';
import interaction_scanline_annotate_Manifest from './interaction/scanline-annotate/card.json';
import {ScanlineAnnotate} from './interaction/scanline-annotate';
import interaction_scribble_annotation_Manifest from './interaction/scribble-annotation/card.json';
import {ScribbleAnnotation} from './interaction/scribble-annotation';
import interaction_segmented_thumb_hero_Manifest from './interaction/segmented-thumb-hero/card.json';
import {SegmentedThumbHero} from './interaction/segmented-thumb-hero';
import interaction_shot_doc_park_left_pill_deal_Manifest from './interaction/shot-doc-park-left-pill-deal/card.json';
import {ShotDocParkLeftPillDeal} from './interaction/shot-doc-park-left-pill-deal';
import interaction_split_60_40_story_Manifest from './interaction/split-60-40-story/card.json';
import {Split6040Story} from './interaction/split-60-40-story';
import interaction_stack_fan_out_Manifest from './interaction/stack-fan-out/card.json';
import {StackFanOut} from './interaction/stack-fan-out';
import interaction_stack_reveal_Manifest from './interaction/stack-reveal/card.json';
import {StackReveal} from './interaction/stack-reveal';
import interaction_subscribe_cta_Manifest from './interaction/subscribe-cta/card.json';
import {SubscribeCta} from './interaction/subscribe-cta';
import interaction_terminal_typing_log_Manifest from './interaction/terminal-typing-log/card.json';
import {TerminalTypingLog} from './interaction/terminal-typing-log';
import interaction_theme_switch_moves_Manifest from './interaction/theme-switch-moves/card.json';
import {ThemeSwitchMoves} from './interaction/theme-switch-moves';
import interaction_type_and_filter_Manifest from './interaction/type-and-filter/card.json';
import {TypeAndFilter} from './interaction/type-and-filter';
import interaction_ui_flow_theater_Manifest from './interaction/ui-flow-theater/card.json';
import {UiFlowTheater} from './interaction/ui-flow-theater';
import interaction_value_stagger_gradient_Manifest from './interaction/value-stagger-gradient/card.json';
import {ValueStaggerGradient} from './interaction/value-stagger-gradient';
import interaction_voice_waveform_live_Manifest from './interaction/voice-waveform-live/card.json';
import {VoiceWaveformLive} from './interaction/voice-waveform-live';
import interaction_wall_reveal_moves_Manifest from './interaction/wall-reveal-moves/card.json';
import {WallRevealMoves} from './interaction/wall-reveal-moves';
import effects_assemble_then_type_flyin_Manifest from './effects/assemble-then-type-flyin/card.json';
import {AssembleThenTypeFlyin} from './effects/assemble-then-type-flyin';
import effects_aurora_bloom_bg_flip_Manifest from './effects/aurora-bloom-bg-flip/card.json';
import {AuroraBloomBgFlip} from './effects/aurora-bloom-bg-flip';
import effects_brand_frame_snap_Manifest from './effects/brand-frame-snap/card.json';
import {BrandFrameSnap} from './effects/brand-frame-snap';
import effects_canvas_particles_Manifest from './effects/canvas-particles/card.json';
import {CanvasParticles} from './effects/canvas-particles';
import effects_converging_arrows_Manifest from './effects/converging-arrows/card.json';
import {ConvergingArrows} from './effects/converging-arrows';
import effects_corner_bracket_frame_Manifest from './effects/corner-bracket-frame/card.json';
import {CornerBracketFrame} from './effects/corner-bracket-frame';
import effects_flying_words_Manifest from './effects/flying-words/card.json';
import {FlyingWords} from './effects/flying-words';
import effects_focus_dim_spotlight_Manifest from './effects/focus-dim-spotlight/card.json';
import {FocusDimSpotlight} from './effects/focus-dim-spotlight';
import effects_fui_hud_moves_Manifest from './effects/fui-hud-moves/card.json';
import {FuiHudMoves} from './effects/fui-hud-moves';
import effects_glow_flyline_moves_Manifest from './effects/glow-flyline-moves/card.json';
import {GlowFlylineMoves} from './effects/glow-flyline-moves';
import effects_icon_performance_moves_Manifest from './effects/icon-performance-moves/card.json';
import {IconPerformanceMoves} from './effects/icon-performance-moves';
import effects_impact_feedback_Manifest from './effects/impact-feedback/card.json';
import {ImpactFeedback} from './effects/impact-feedback';
import effects_light_play_moves_Manifest from './effects/light-play-moves/card.json';
import {LightPlayMoves} from './effects/light-play-moves';
import effects_radial_ripple_phone_chips_Manifest from './effects/radial-ripple-phone-chips/card.json';
import {RadialRipplePhoneChips} from './effects/radial-ripple-phone-chips';
import effects_reticle_lock_on_Manifest from './effects/reticle-lock-on/card.json';
import {ReticleLockOn} from './effects/reticle-lock-on';
import effects_riso_print_hits_Manifest from './effects/riso-print-hits/card.json';
import {RisoPrintHits} from './effects/riso-print-hits';
import effects_scan_bracket_sweep_Manifest from './effects/scan-bracket-sweep/card.json';
import {ScanBracketSweep} from './effects/scan-bracket-sweep';
import effects_scanline_annotate_focus_Manifest from './effects/scanline-annotate-focus/card.json';
import {ScanlineAnnotateFocus} from './effects/scanline-annotate-focus';
import effects_scanline_assemble_flyin_Manifest from './effects/scanline-assemble-flyin/card.json';
import {ScanlineAssembleFlyin} from './effects/scanline-assemble-flyin';
import effects_slam_entrance_moves_Manifest from './effects/slam-entrance-moves/card.json';
import {SlamEntranceMoves} from './effects/slam-entrance-moves';
import effects_spotlight_sweep_moves_Manifest from './effects/spotlight-sweep-moves/card.json';
import {SpotlightSweepMoves} from './effects/spotlight-sweep-moves';
import effects_three_crystal_Manifest from './effects/three-crystal/card.json';
import {ThreeCrystal} from './effects/three-crystal';
import rhythm_beat_cut_moves_Manifest from './rhythm/beat-cut-moves/card.json';
import {BeatCutMoves} from './rhythm/beat-cut-moves';
import rhythm_beat_step_list_theme_cycle_Manifest from './rhythm/beat-step-list-theme-cycle/card.json';
import {BeatStepListThemeCycle} from './rhythm/beat-step-list-theme-cycle';
import rhythm_panel_grid_moves_Manifest from './rhythm/panel-grid-moves/card.json';
import {PanelGridMoves} from './rhythm/panel-grid-moves';
import rhythm_quad_split_parallel_scenes_Manifest from './rhythm/quad-split-parallel-scenes/card.json';
import {QuadSplitParallelScenes} from './rhythm/quad-split-parallel-scenes';
import rhythm_rhythm_interrupt_moves_Manifest from './rhythm/rhythm-interrupt-moves/card.json';
import {RhythmInterruptMoves} from './rhythm/rhythm-interrupt-moves';
import rhythm_sakuga_timing_shift_Manifest from './rhythm/sakuga-timing-shift/card.json';
import {SakugaTimingShift} from './rhythm/sakuga-timing-shift';
import rhythm_speed_ramp_freeze_Manifest from './rhythm/speed-ramp-freeze/card.json';
import {SpeedRampFreeze} from './rhythm/speed-ramp-freeze';
import rhythm_trailer_grammar_moves_Manifest from './rhythm/trailer-grammar-moves/card.json';
import {TrailerGrammarMoves} from './rhythm/trailer-grammar-moves';
import transition_black_slam_Manifest from './transition/black-slam/card.json';
import {BlackSlam} from './transition/black-slam';
import transition_bottom_push_stack_wipe_Manifest from './transition/bottom-push-stack-wipe/card.json';
import {BottomPushStackWipe} from './transition/bottom-push-stack-wipe';
import transition_card_flip_reveal_Manifest from './transition/card-flip-reveal/card.json';
import {CardFlipReveal} from './transition/card-flip-reveal';
import transition_card_flock_tumble_Manifest from './transition/card-flock-tumble/card.json';
import {CardFlockTumble} from './transition/card-flock-tumble';
import transition_caret_wipe_Manifest from './transition/caret-wipe/card.json';
import {CaretWipe} from './transition/caret-wipe';
import transition_circle_match_iris_Manifest from './transition/circle-match-iris/card.json';
import {CircleMatchIris} from './transition/circle-match-iris';
import transition_cube_rotate_Manifest from './transition/cube-rotate/card.json';
import {CubeRotate} from './transition/cube-rotate';
import transition_gradient_transition_Manifest from './transition/gradient-transition/card.json';
import {GradientTransition} from './transition/gradient-transition';
import transition_line_carry_Manifest from './transition/line-carry/card.json';
import {LineCarry} from './transition/line-carry';
import transition_line_carry_transition_Manifest from './transition/line-carry-transition/card.json';
import {LineCarryTransition} from './transition/line-carry-transition';
import transition_long_take_world_Manifest from './transition/long-take-world/card.json';
import {LongTakeWorld} from './transition/long-take-world';
import transition_mosaic_reframe_Manifest from './transition/mosaic-reframe/card.json';
import {MosaicReframe} from './transition/mosaic-reframe';
import transition_overexpose_flip_Manifest from './transition/overexpose-flip/card.json';
import {OverexposeFlip} from './transition/overexpose-flip';
import transition_page_turn_transitions_Manifest from './transition/page-turn-transitions/card.json';
import {PageTurnTransitions} from './transition/page-turn-transitions';
import transition_particle_weld_Manifest from './transition/particle-weld/card.json';
import {ParticleWeld} from './transition/particle-weld';
import transition_print_texture_transitions_Manifest from './transition/print-texture-transitions/card.json';
import {PrintTextureTransitions} from './transition/print-texture-transitions';
import transition_pullback_cool_Manifest from './transition/pullback-cool/card.json';
import {PullbackCool} from './transition/pullback-cool';
import transition_push_through_Manifest from './transition/push-through/card.json';
import {PushThrough} from './transition/push-through';
import transition_shape_wipe_Manifest from './transition/shape-wipe/card.json';
import {ShapeWipe} from './transition/shape-wipe';
import transition_shot_transitions_Manifest from './transition/shot-transitions/card.json';
import {ShotTransitions} from './transition/shot-transitions';
import transition_tear_streak_transitions_Manifest from './transition/tear-streak-transitions/card.json';
import {TearStreakTransitions} from './transition/tear-streak-transitions';
import transition_transition_hidden_cut_Manifest from './transition/transition-hidden-cut/card.json';
import {TransitionHiddenCut} from './transition/transition-hidden-cut';
import transition_transition_travel_Manifest from './transition/transition-travel/card.json';
import {TransitionTravel} from './transition/transition-travel';
import transition_whip_pan_Manifest from './transition/whip-pan/card.json';
import {WhipPan} from './transition/whip-pan';
import transition_white_flash_logo_simplify_cut_Manifest from './transition/white-flash-logo-simplify-cut/card.json';
import {WhiteFlashLogoSimplifyCut} from './transition/white-flash-logo-simplify-cut';
import transition_wipe_transitions_Manifest from './transition/wipe-transitions/card.json';
import {WipeTransitions} from './transition/wipe-transitions';
import commercial_before_after_Manifest from './commercial/before-after/card.json';
import {BeforeAfter} from './commercial/before-after';
import commercial_brand_ink_open_Manifest from './commercial/brand-ink-open/card.json';
import {BrandInkOpen} from './commercial/brand-ink-open';
import commercial_chapter_progress_list_Manifest from './commercial/chapter-progress-list/card.json';
import {ChapterProgressList} from './commercial/chapter-progress-list';
import commercial_chapter_title_Manifest from './commercial/chapter-title/card.json';
import {ChapterTitle} from './commercial/chapter-title';
import commercial_chat_Manifest from './commercial/chat/card.json';
import {Chat} from './commercial/chat';
import commercial_chevron_lower_third_Manifest from './commercial/chevron-lower-third/card.json';
import {ChevronLowerThird} from './commercial/chevron-lower-third';
import commercial_compare_Manifest from './commercial/compare/card.json';
import {Compare} from './commercial/compare';
import commercial_counter_Manifest from './commercial/counter/card.json';
import {Counter} from './commercial/counter';
import commercial_crane_rise_reveal_Manifest from './commercial/crane-rise-reveal/card.json';
import {CraneRiseReveal} from './commercial/crane-rise-reveal';
import commercial_cred_card_Manifest from './commercial/cred-card/card.json';
import {CredCard} from './commercial/cred-card';
import commercial_data_chart_Manifest from './commercial/data-chart/card.json';
import {DataChart} from './commercial/data-chart';
import commercial_dataviz_landscape_open_Manifest from './commercial/dataviz-landscape-open/card.json';
import {DatavizLandscapeOpen} from './commercial/dataviz-landscape-open';
import commercial_douyin_follow_card_Manifest from './commercial/douyin-follow-card/card.json';
import {DouyinFollowCard} from './commercial/douyin-follow-card';
import commercial_end_card_Manifest from './commercial/end-card/card.json';
import {EndCard} from './commercial/end-card';
import commercial_fact_sheet_Manifest from './commercial/fact-sheet/card.json';
import {FactSheet} from './commercial/fact-sheet';
import commercial_features_Manifest from './commercial/features/card.json';
import {Features} from './commercial/features';
import commercial_fracture_Manifest from './commercial/fracture/card.json';
import {Fracture} from './commercial/fracture';
import commercial_grain_dissolve_Manifest from './commercial/grain-dissolve/card.json';
import {GrainDissolve} from './commercial/grain-dissolve';
import commercial_hook_Manifest from './commercial/hook/card.json';
import {Hook} from './commercial/hook';
import commercial_icon_field_colorize_Manifest from './commercial/icon-field-colorize/card.json';
import {IconFieldColorize} from './commercial/icon-field-colorize';
import commercial_letterspace_materialize_Manifest from './commercial/letterspace-materialize/card.json';
import {LetterspaceMaterialize} from './commercial/letterspace-materialize';
import commercial_logo_enter_Manifest from './commercial/logo-enter/card.json';
import {LogoEnter} from './commercial/logo-enter';
import commercial_logo_shrink_wordmark_lockup_Manifest from './commercial/logo-shrink-wordmark-lockup/card.json';
import {LogoShrinkWordmarkLockup} from './commercial/logo-shrink-wordmark-lockup';
import commercial_lower_third_Manifest from './commercial/lower-third/card.json';
import {LowerThird} from './commercial/lower-third';
import commercial_magician_card_flourish_Manifest from './commercial/magician-card-flourish/card.json';
import {MagicianCardFlourish} from './commercial/magician-card-flourish';
import commercial_meter_Manifest from './commercial/meter/card.json';
import {Meter} from './commercial/meter';
import commercial_mock_app_Manifest from './commercial/mock-app/card.json';
import {MockApp} from './commercial/mock-app';
import commercial_neon_triple_marquee_Manifest from './commercial/neon-triple-marquee/card.json';
import {NeonTripleMarquee} from './commercial/neon-triple-marquee';
import commercial_orbit_ring_title_open_Manifest from './commercial/orbit-ring-title-open/card.json';
import {OrbitRingTitleOpen} from './commercial/orbit-ring-title-open';
import commercial_outro_group_photo_launch_Manifest from './commercial/outro-group-photo-launch/card.json';
import {OutroGroupPhotoLaunch} from './commercial/outro-group-photo-launch';
import commercial_phone_Manifest from './commercial/phone/card.json';
import {Phone} from './commercial/phone';
import commercial_photo_shot_Manifest from './commercial/photo-shot/card.json';
import {PhotoShot} from './commercial/photo-shot';
import commercial_price_card_Manifest from './commercial/price-card/card.json';
import {PriceCard} from './commercial/price-card';
import commercial_quick_list_Manifest from './commercial/quick-list/card.json';
import {QuickList} from './commercial/quick-list';
import commercial_review_card_Manifest from './commercial/review-card/card.json';
import {ReviewCard} from './commercial/review-card';
import commercial_spotlight_hero_card_Manifest from './commercial/spotlight-hero-card/card.json';
import {SpotlightHeroCard} from './commercial/spotlight-hero-card';
import commercial_steps_Manifest from './commercial/steps/card.json';
import {Steps} from './commercial/steps';
import commercial_store_card_Manifest from './commercial/store-card/card.json';
import {StoreCard} from './commercial/store-card';
import commercial_stroke_segment_build_Manifest from './commercial/stroke-segment-build/card.json';
import {StrokeSegmentBuild} from './commercial/stroke-segment-build';
import commercial_text_as_mask_Manifest from './commercial/text-as-mask/card.json';
import {TextAsMask} from './commercial/text-as-mask';
import commercial_ui_strip_away_outro_Manifest from './commercial/ui-strip-away-outro/card.json';
import {UiStripAwayOutro} from './commercial/ui-strip-away-outro';
import commercial_ui_to_brand_morph_Manifest from './commercial/ui-to-brand-morph/card.json';
import {UiToBrandMorph} from './commercial/ui-to-brand-morph';
import commercial_x_follow_card_Manifest from './commercial/x-follow-card/card.json';
import {XFollowCard} from './commercial/x-follow-card';
import media_bed_echo_blur_Manifest from './media/bed-echo-blur/card.json';
import {BedEchoBlur} from './media/bed-echo-blur';
import media_evidence_scroll_tour_Manifest from './media/evidence-scroll-tour/card.json';
import {EvidenceScrollTour} from './media/evidence-scroll-tour';
import media_filmstrip_conveyor_Manifest from './media/filmstrip-conveyor/card.json';
import {FilmstripConveyor} from './media/filmstrip-conveyor';
import media_gallery_wall_dolly_Manifest from './media/gallery-wall-dolly/card.json';
import {GalleryWallDolly} from './media/gallery-wall-dolly';
import media_grid_to_hero_Manifest from './media/grid-to-hero/card.json';
import {GridToHero} from './media/grid-to-hero';
import media_map_route_Manifest from './media/map-route/card.json';
import {MapRoute} from './media/map-route';
import media_motion_blur_slam_in_Manifest from './media/motion-blur-slam-in/card.json';
import {MotionBlurSlamIn} from './media/motion-blur-slam-in';
import media_pencil_sketch_draw_Manifest from './media/pencil-sketch-draw/card.json';
import {PencilSketchDraw} from './media/pencil-sketch-draw';
import media_pop_in_Manifest from './media/pop-in/card.json';
import {MediaPopIn} from './media/pop-in';
import media_rack_focus_Manifest from './media/rack-focus/card.json';
import {RackFocus} from './media/rack-focus';
import media_split_compare_Manifest from './media/split-compare/card.json';
import {SplitCompare} from './media/split-compare';
import media_still_layout_relay_Manifest from './media/still-layout-relay/card.json';
import {StillLayoutRelay} from './media/still-layout-relay';
import media_svg_path_Manifest from './media/svg-path/card.json';
import {SvgPath} from './media/svg-path';
import media_timeline_photo_strip_Manifest from './media/timeline-photo-strip/card.json';
import {TimelinePhotoStrip} from './media/timeline-photo-strip';
import media_word_relay_filmstrip_Manifest from './media/word-relay-filmstrip/card.json';
import {WordRelayFilmstrip} from './media/word-relay-filmstrip';

export const cardDefinitions: MotionCardDefinition[] = [
  {
    manifest: motionCardManifestSchema.parse(camera_basic_3d_scene_Manifest),
    Component: Basic3dScene,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_crash_zoom_punch_Manifest),
    Component: CrashZoomPunch,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_cursor_flyover_Manifest),
    Component: CursorFlyover,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_cursor_locked_zoom_Manifest),
    Component: CursorLockedZoom,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_depth_layer_moves_Manifest),
    Component: DepthLayerMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_dolly_zoom_Manifest),
    Component: DollyZoom,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_graze_face_tour_Manifest),
    Component: GrazeFaceTour,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_magnifier_detail_Manifest),
    Component: MagnifierDetail,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_orbit_drift_Manifest),
    Component: OrbitDrift,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_overhead_camera_moves_Manifest),
    Component: OverheadCameraMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_pip_zoom_box_Manifest),
    Component: PipZoomBox,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_shot_crash_zoom_punch_Manifest),
    Component: ShotCrashZoomPunch,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_slow_pull_Manifest),
    Component: SlowPull,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_slow_push_Manifest),
    Component: SlowPush,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_space_camera_moves_Manifest),
    Component: SpaceCameraMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_stage_keyframe_tour_Manifest),
    Component: StageKeyframeTour,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_steep_tilt_glide_Manifest),
    Component: SteepTiltGlide,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_sway_parallax_Manifest),
    Component: SwayParallax,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_tension_camera_moves_Manifest),
    Component: TensionCameraMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_terminal_3d_Manifest),
    Component: Terminal3d,
  },
  {
    manifest: motionCardManifestSchema.parse(camera_tilt_3d_page_Manifest),
    Component: Tilt3dPage,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_alt_block_lines_Manifest),
    Component: AltBlockLines,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_behind_text_title_Manifest),
    Component: BehindTextTitle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_blur_slide_Manifest),
    Component: BlurSlide,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_brace_expand_Manifest),
    Component: BraceExpand,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_char_rise_Manifest),
    Component: CharRise,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_color_slam_beat_card_Manifest),
    Component: ColorSlamBeatCard,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_count_badge_title_Manifest),
    Component: CountBadgeTitle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_countdown_arc_scatter_Manifest),
    Component: CountdownArcScatter,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_document_typewriter_reveal_Manifest),
    Component: DocumentTypewriterReveal,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_error_retype_Manifest),
    Component: ErrorRetype,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_glitch_cycle_Manifest),
    Component: GlitchCycle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_gradient_word_sweep_Manifest),
    Component: GradientWordSweep,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_halation_bloom_Manifest),
    Component: HalationBloom,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_highlighter_sweep_Manifest),
    Component: HighlighterSweep,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_impact_open_title_Manifest),
    Component: ImpactOpenTitle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_ink_underline_Manifest),
    Component: InkUnderline,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_keyword_pop_highlight_Manifest),
    Component: KeywordPopHighlight,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_keyword_reveal_Manifest),
    Component: KeywordReveal,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_lead_word_zoom_assemble_Manifest),
    Component: LeadWordZoomAssemble,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_line_slide_Manifest),
    Component: LineSlide,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_marker_underline_title_Manifest),
    Component: MarkerUnderlineTitle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_outline_box_title_Manifest),
    Component: OutlineBoxTitle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_outline_word_fill_Manifest),
    Component: OutlineWordFill,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_paper_title_card_Manifest),
    Component: PaperTitleCard,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_pill_chip_slot_cycle_handled_Manifest),
    Component: PillChipSlotCycleHandled,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_pill_slot_cycle_Manifest),
    Component: PillSlotCycle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_quote_bracket_pull_Manifest),
    Component: QuoteBracketPull,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_quote_card_Manifest),
    Component: QuoteCard,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_quote_hold_arrow_Manifest),
    Component: QuoteHoldArrow,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_scramble_decode_Manifest),
    Component: ScrambleDecode,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_shot_countdown_arc_scatter_Manifest),
    Component: ShotCountdownArcScatter,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_shot_lead_word_zoom_assemble_Manifest),
    Component: ShotLeadWordZoomAssemble,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_shot_title_demote_to_label_Manifest),
    Component: ShotTitleDemoteToLabel,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_slab_punch_title_Manifest),
    Component: SlabPunchTitle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_soft_blur_in_Manifest),
    Component: SoftBlurIn,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_speed_slab_title_Manifest),
    Component: SpeedSlabTitle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_split_flap_flip_Manifest),
    Component: SplitFlapFlip,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_split_text_stagger_Manifest),
    Component: SplitTextStagger,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_strike_replace_Manifest),
    Component: StrikeReplace,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_text_column_converge_Manifest),
    Component: TextColumnConverge,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_title_demote_to_label_Manifest),
    Component: TitleDemoteToLabel,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_tracking_in_Manifest),
    Component: TrackingIn,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_type_assembly_moves_Manifest),
    Component: TypeAssemblyMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_type_contrast_emphasis_Manifest),
    Component: TypeContrastEmphasis,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_type_entrance_moves_Manifest),
    Component: TypeEntranceMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_type_rhythm_sync_Manifest),
    Component: TypeRhythmSync,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_typewriter_moves_Manifest),
    Component: TypewriterMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_typewriter_reveal_Manifest),
    Component: TypewriterReveal,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_vertical_word_roll_blur_cycle_Manifest),
    Component: VerticalWordRollBlurCycle,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_word_relay_filmstrip_Manifest),
    Component: ShotTextWordRelayFilmstrip,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_word_relay_geometry_Manifest),
    Component: WordRelayGeometry,
  },
  {
    manifest: motionCardManifestSchema.parse(typography_word_slot_cycle_Manifest),
    Component: WordSlotCycle,
  },
  {
    manifest: motionCardManifestSchema.parse(data_bar_chart_growth_Manifest),
    Component: BarChartGrowth,
  },
  {
    manifest: motionCardManifestSchema.parse(data_before_after_slider_scrub_Manifest),
    Component: BeforeAfterSliderScrub,
  },
  {
    manifest: motionCardManifestSchema.parse(data_chart_grow_Manifest),
    Component: ChartGrow,
  },
  {
    manifest: motionCardManifestSchema.parse(data_chart_live_moves_Manifest),
    Component: ChartLiveMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(data_chip_grid_single_select_Manifest),
    Component: ChipGridSingleSelect,
  },
  {
    manifest: motionCardManifestSchema.parse(data_counter_confetti_Manifest),
    Component: CounterConfetti,
  },
  {
    manifest: motionCardManifestSchema.parse(data_gauge_readout_moves_Manifest),
    Component: GaugeReadoutMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(data_info_term_card_Manifest),
    Component: InfoTermCard,
  },
  {
    manifest: motionCardManifestSchema.parse(data_line_chart_story_draw_Manifest),
    Component: LineChartStoryDraw,
  },
  {
    manifest: motionCardManifestSchema.parse(data_metric_sparkline_Manifest),
    Component: MetricSparkline,
  },
  {
    manifest: motionCardManifestSchema.parse(data_number_counter_Manifest),
    Component: NumberCounter,
  },
  {
    manifest: motionCardManifestSchema.parse(data_number_slab_pop_Manifest),
    Component: NumberSlabPop,
  },
  {
    manifest: motionCardManifestSchema.parse(data_particle_sand_fill_Manifest),
    Component: ParticleSandFill,
  },
  {
    manifest: motionCardManifestSchema.parse(data_scroll_brake_moves_Manifest),
    Component: ScrollBrakeMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(data_source_converge_Manifest),
    Component: SourceConverge,
  },
  {
    manifest: motionCardManifestSchema.parse(data_step_stack_Manifest),
    Component: StepStack,
  },
  {
    manifest: motionCardManifestSchema.parse(data_step_timeline_Manifest),
    Component: StepTimeline,
  },
  {
    manifest: motionCardManifestSchema.parse(data_timeline_travel_Manifest),
    Component: TimelineTravel,
  },
  {
    manifest: motionCardManifestSchema.parse(data_ui_prop_theater_Manifest),
    Component: UiPropTheater,
  },
  {
    manifest: motionCardManifestSchema.parse(data_unit_grid_proportion_Manifest),
    Component: UnitGridProportion,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_autolayout_gap_dial_Manifest),
    Component: AutolayoutGapDial,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_avatar_bracket_carousel_Manifest),
    Component: AvatarBracketCarousel,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_bezier_source_converge_merge_Manifest),
    Component: BezierSourceConvergeMerge,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_callout_line_label_Manifest),
    Component: CalloutLineLabel,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_canvas_materialize_moves_Manifest),
    Component: CanvasMaterializeMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_card_fan_Manifest),
    Component: CardFan,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_carousel_3d_Manifest),
    Component: Carousel3d,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_chat_gpt_Manifest),
    Component: ChatGpt,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_chat_message_flow_Manifest),
    Component: ChatMessageFlow,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_chip_grid_single_select_blackout_Manifest),
    Component: ChipGridSingleSelectBlackout,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_claude_code_Manifest),
    Component: ClaudeCode,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_cloner_depth_echo_Manifest),
    Component: ClonerDepthEcho,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_collab_cursor_moves_Manifest),
    Component: CollabCursorMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_command_palette_summon_Manifest),
    Component: CommandPaletteSummon,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_cursor_actor_demo_Manifest),
    Component: CursorActorDemo,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_danmu_bubble_praise_Manifest),
    Component: DanmuBubblePraise,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_deck_deal_flyin_Manifest),
    Component: DeckDealFlyin,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_doc_park_left_pill_deal_Manifest),
    Component: DocParkLeftPillDeal,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_draw_svg_trace_Manifest),
    Component: DrawSvgTrace,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_element_body_moves_Manifest),
    Component: ElementBodyMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_glass_code_walk_Manifest),
    Component: GlassCodeWalk,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_glass_pill_dictation_typing_Manifest),
    Component: GlassPillDictationTyping,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_gooey_morph_Manifest),
    Component: GooeyMorph,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_hand_drawn_ellipse_Manifest),
    Component: HandDrawnEllipse,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_hashtag_to_pill_materialize_Manifest),
    Component: HashtagToPillMaterialize,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_host_card_glass_board_Manifest),
    Component: HostCardGlassBoard,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_host_shrink_to_chip_Manifest),
    Component: HostShrinkToChip,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_info_card_assemble_Manifest),
    Component: InfoCardAssemble,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_integration_hub_map_Manifest),
    Component: IntegrationHubMap,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_list_reveal_Manifest),
    Component: ListReveal,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_list_stack_press_Manifest),
    Component: ListStackPress,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_masking_tape_slap_Manifest),
    Component: MaskingTapeSlap,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_neon_frame_forerun_Manifest),
    Component: NeonFrameForerun,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_neon_frame_orbit_drop_Manifest),
    Component: NeonFrameOrbitDrop,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_news_card_desk_Manifest),
    Component: NewsCardDesk,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_page_waterfall_wall_Manifest),
    Component: PageWaterfallWall,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_parallel_items_with_host_Manifest),
    Component: ParallelItemsWithHost,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_picker_carousel_feature_cycle_Manifest),
    Component: PickerCarouselFeatureCycle,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_popup_book_rise_Manifest),
    Component: PopupBookRise,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_product_card_progressive_assemble_Manifest),
    Component: ProductCardProgressiveAssemble,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_radial_wave_Manifest),
    Component: RadialWave,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_research_card_stack_scroll_Manifest),
    Component: ResearchCardStackScroll,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_row_embed_Manifest),
    Component: RowEmbed,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_scanline_annotate_Manifest),
    Component: ScanlineAnnotate,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_scribble_annotation_Manifest),
    Component: ScribbleAnnotation,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_segmented_thumb_hero_Manifest),
    Component: SegmentedThumbHero,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_shot_doc_park_left_pill_deal_Manifest),
    Component: ShotDocParkLeftPillDeal,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_split_60_40_story_Manifest),
    Component: Split6040Story,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_stack_fan_out_Manifest),
    Component: StackFanOut,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_stack_reveal_Manifest),
    Component: StackReveal,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_subscribe_cta_Manifest),
    Component: SubscribeCta,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_terminal_typing_log_Manifest),
    Component: TerminalTypingLog,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_theme_switch_moves_Manifest),
    Component: ThemeSwitchMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_type_and_filter_Manifest),
    Component: TypeAndFilter,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_ui_flow_theater_Manifest),
    Component: UiFlowTheater,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_value_stagger_gradient_Manifest),
    Component: ValueStaggerGradient,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_voice_waveform_live_Manifest),
    Component: VoiceWaveformLive,
  },
  {
    manifest: motionCardManifestSchema.parse(interaction_wall_reveal_moves_Manifest),
    Component: WallRevealMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_assemble_then_type_flyin_Manifest),
    Component: AssembleThenTypeFlyin,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_aurora_bloom_bg_flip_Manifest),
    Component: AuroraBloomBgFlip,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_brand_frame_snap_Manifest),
    Component: BrandFrameSnap,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_canvas_particles_Manifest),
    Component: CanvasParticles,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_converging_arrows_Manifest),
    Component: ConvergingArrows,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_corner_bracket_frame_Manifest),
    Component: CornerBracketFrame,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_flying_words_Manifest),
    Component: FlyingWords,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_focus_dim_spotlight_Manifest),
    Component: FocusDimSpotlight,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_fui_hud_moves_Manifest),
    Component: FuiHudMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_glow_flyline_moves_Manifest),
    Component: GlowFlylineMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_icon_performance_moves_Manifest),
    Component: IconPerformanceMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_impact_feedback_Manifest),
    Component: ImpactFeedback,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_light_play_moves_Manifest),
    Component: LightPlayMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_radial_ripple_phone_chips_Manifest),
    Component: RadialRipplePhoneChips,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_reticle_lock_on_Manifest),
    Component: ReticleLockOn,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_riso_print_hits_Manifest),
    Component: RisoPrintHits,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_scan_bracket_sweep_Manifest),
    Component: ScanBracketSweep,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_scanline_annotate_focus_Manifest),
    Component: ScanlineAnnotateFocus,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_scanline_assemble_flyin_Manifest),
    Component: ScanlineAssembleFlyin,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_slam_entrance_moves_Manifest),
    Component: SlamEntranceMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_spotlight_sweep_moves_Manifest),
    Component: SpotlightSweepMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(effects_three_crystal_Manifest),
    Component: ThreeCrystal,
  },
  {
    manifest: motionCardManifestSchema.parse(rhythm_beat_cut_moves_Manifest),
    Component: BeatCutMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(rhythm_beat_step_list_theme_cycle_Manifest),
    Component: BeatStepListThemeCycle,
  },
  {
    manifest: motionCardManifestSchema.parse(rhythm_panel_grid_moves_Manifest),
    Component: PanelGridMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(rhythm_quad_split_parallel_scenes_Manifest),
    Component: QuadSplitParallelScenes,
  },
  {
    manifest: motionCardManifestSchema.parse(rhythm_rhythm_interrupt_moves_Manifest),
    Component: RhythmInterruptMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(rhythm_sakuga_timing_shift_Manifest),
    Component: SakugaTimingShift,
  },
  {
    manifest: motionCardManifestSchema.parse(rhythm_speed_ramp_freeze_Manifest),
    Component: SpeedRampFreeze,
  },
  {
    manifest: motionCardManifestSchema.parse(rhythm_trailer_grammar_moves_Manifest),
    Component: TrailerGrammarMoves,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_black_slam_Manifest),
    Component: BlackSlam,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_bottom_push_stack_wipe_Manifest),
    Component: BottomPushStackWipe,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_card_flip_reveal_Manifest),
    Component: CardFlipReveal,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_card_flock_tumble_Manifest),
    Component: CardFlockTumble,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_caret_wipe_Manifest),
    Component: CaretWipe,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_circle_match_iris_Manifest),
    Component: CircleMatchIris,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_cube_rotate_Manifest),
    Component: CubeRotate,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_gradient_transition_Manifest),
    Component: GradientTransition,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_line_carry_Manifest),
    Component: LineCarry,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_line_carry_transition_Manifest),
    Component: LineCarryTransition,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_long_take_world_Manifest),
    Component: LongTakeWorld,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_mosaic_reframe_Manifest),
    Component: MosaicReframe,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_overexpose_flip_Manifest),
    Component: OverexposeFlip,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_page_turn_transitions_Manifest),
    Component: PageTurnTransitions,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_particle_weld_Manifest),
    Component: ParticleWeld,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_print_texture_transitions_Manifest),
    Component: PrintTextureTransitions,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_pullback_cool_Manifest),
    Component: PullbackCool,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_push_through_Manifest),
    Component: PushThrough,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_shape_wipe_Manifest),
    Component: ShapeWipe,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_shot_transitions_Manifest),
    Component: ShotTransitions,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_tear_streak_transitions_Manifest),
    Component: TearStreakTransitions,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_transition_hidden_cut_Manifest),
    Component: TransitionHiddenCut,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_transition_travel_Manifest),
    Component: TransitionTravel,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_whip_pan_Manifest),
    Component: WhipPan,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_white_flash_logo_simplify_cut_Manifest),
    Component: WhiteFlashLogoSimplifyCut,
  },
  {
    manifest: motionCardManifestSchema.parse(transition_wipe_transitions_Manifest),
    Component: WipeTransitions,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_before_after_Manifest),
    Component: BeforeAfter,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_brand_ink_open_Manifest),
    Component: BrandInkOpen,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_chapter_progress_list_Manifest),
    Component: ChapterProgressList,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_chapter_title_Manifest),
    Component: ChapterTitle,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_chat_Manifest),
    Component: Chat,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_chevron_lower_third_Manifest),
    Component: ChevronLowerThird,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_compare_Manifest),
    Component: Compare,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_counter_Manifest),
    Component: Counter,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_crane_rise_reveal_Manifest),
    Component: CraneRiseReveal,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_cred_card_Manifest),
    Component: CredCard,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_data_chart_Manifest),
    Component: DataChart,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_dataviz_landscape_open_Manifest),
    Component: DatavizLandscapeOpen,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_douyin_follow_card_Manifest),
    Component: DouyinFollowCard,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_end_card_Manifest),
    Component: EndCard,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_fact_sheet_Manifest),
    Component: FactSheet,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_features_Manifest),
    Component: Features,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_fracture_Manifest),
    Component: Fracture,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_grain_dissolve_Manifest),
    Component: GrainDissolve,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_hook_Manifest),
    Component: Hook,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_icon_field_colorize_Manifest),
    Component: IconFieldColorize,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_letterspace_materialize_Manifest),
    Component: LetterspaceMaterialize,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_logo_enter_Manifest),
    Component: LogoEnter,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_logo_shrink_wordmark_lockup_Manifest),
    Component: LogoShrinkWordmarkLockup,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_lower_third_Manifest),
    Component: LowerThird,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_magician_card_flourish_Manifest),
    Component: MagicianCardFlourish,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_meter_Manifest),
    Component: Meter,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_mock_app_Manifest),
    Component: MockApp,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_neon_triple_marquee_Manifest),
    Component: NeonTripleMarquee,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_orbit_ring_title_open_Manifest),
    Component: OrbitRingTitleOpen,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_outro_group_photo_launch_Manifest),
    Component: OutroGroupPhotoLaunch,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_phone_Manifest),
    Component: Phone,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_photo_shot_Manifest),
    Component: PhotoShot,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_price_card_Manifest),
    Component: PriceCard,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_quick_list_Manifest),
    Component: QuickList,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_review_card_Manifest),
    Component: ReviewCard,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_spotlight_hero_card_Manifest),
    Component: SpotlightHeroCard,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_steps_Manifest),
    Component: Steps,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_store_card_Manifest),
    Component: StoreCard,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_stroke_segment_build_Manifest),
    Component: StrokeSegmentBuild,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_text_as_mask_Manifest),
    Component: TextAsMask,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_ui_strip_away_outro_Manifest),
    Component: UiStripAwayOutro,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_ui_to_brand_morph_Manifest),
    Component: UiToBrandMorph,
  },
  {
    manifest: motionCardManifestSchema.parse(commercial_x_follow_card_Manifest),
    Component: XFollowCard,
  },
  {
    manifest: motionCardManifestSchema.parse(media_bed_echo_blur_Manifest),
    Component: BedEchoBlur,
  },
  {
    manifest: motionCardManifestSchema.parse(media_evidence_scroll_tour_Manifest),
    Component: EvidenceScrollTour,
  },
  {
    manifest: motionCardManifestSchema.parse(media_filmstrip_conveyor_Manifest),
    Component: FilmstripConveyor,
  },
  {
    manifest: motionCardManifestSchema.parse(media_gallery_wall_dolly_Manifest),
    Component: GalleryWallDolly,
  },
  {
    manifest: motionCardManifestSchema.parse(media_grid_to_hero_Manifest),
    Component: GridToHero,
  },
  {
    manifest: motionCardManifestSchema.parse(media_map_route_Manifest),
    Component: MapRoute,
  },
  {
    manifest: motionCardManifestSchema.parse(media_motion_blur_slam_in_Manifest),
    Component: MotionBlurSlamIn,
  },
  {
    manifest: motionCardManifestSchema.parse(media_pencil_sketch_draw_Manifest),
    Component: PencilSketchDraw,
  },
  {
    manifest: motionCardManifestSchema.parse(media_pop_in_Manifest),
    Component: MediaPopIn,
  },
  {
    manifest: motionCardManifestSchema.parse(media_rack_focus_Manifest),
    Component: RackFocus,
  },
  {
    manifest: motionCardManifestSchema.parse(media_split_compare_Manifest),
    Component: SplitCompare,
  },
  {
    manifest: motionCardManifestSchema.parse(media_still_layout_relay_Manifest),
    Component: StillLayoutRelay,
  },
  {
    manifest: motionCardManifestSchema.parse(media_svg_path_Manifest),
    Component: SvgPath,
  },
  {
    manifest: motionCardManifestSchema.parse(media_timeline_photo_strip_Manifest),
    Component: TimelinePhotoStrip,
  },
  {
    manifest: motionCardManifestSchema.parse(media_word_relay_filmstrip_Manifest),
    Component: WordRelayFilmstrip,
  },
];

export const cardRegistry = new Map<string, MotionCardDefinition>(
  cardDefinitions.map((card) => [card.manifest.id, card])
);
