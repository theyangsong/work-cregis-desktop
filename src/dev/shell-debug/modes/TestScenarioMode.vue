<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import {
  EgButton,
  EgIcon,
  EgSegmented,
  MOTION_LAYOUT_DEFORM_CONTENT,
  MOTION_LAYOUT_DEFORM_CONTENT_ENTERING,
  MOTION_LAYOUT_DEFORM_CONTENT_EXITING,
  useMotionLayoutDeformPageSwitch,
  type MotionLayoutDeformPageSpec,
} from '@eds/desktop-components';
import { useScrollChromeScrim } from '@/scenes/tasks/shared/useScrollChromeScrim';
import type { ShellPageKey } from '../pageKeyFromShell';
import {
  listQaBusinessScenariosForPage,
  listQaCommonScenarios,
} from '../registry';
import {
  shellDebugPopoverContentMaxHeight,
  shellDebugPopoverContentMinHeight,
} from '../shellDebugPopover.constants';
import styles from './TestScenarioMode.module.css';

const props = defineProps<{
  pageKey: ShellPageKey;
}>();

type QaScopePage = 'business' | 'common';

const QA_SCOPE_LABELS = ['业务态', '通用态'] as const;
const QA_TOP_TOOL_HEAD_CLASS = 'shell-debug-qa-top-tool-head';

const segmentedIndex = ref(0);
const shellRef = ref<HTMLElement | null>(null);
const metaRef = ref<HTMLElement | null>(null);
const topToolHeadTarget = ref<HTMLElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const commonMeasureRef = ref<HTMLElement | null>(null);
const businessMeasureRef = ref<HTMLElement | null>(null);
const commonRawHeight = ref(shellDebugPopoverContentMinHeight);
const businessRawHeight = ref(shellDebugPopoverContentMinHeight);
const shellMeasureReady = ref(false);
const { bottomScrim, update: updateScrollScrim } = useScrollChromeScrim(scrollRef);

const lastAppliedId = ref<string | null>(null);

const commonScenarios = computed(() => listQaCommonScenarios());
const businessScenarios = computed(() => listQaBusinessScenariosForPage(props.pageKey));

const pageSpecs = reactive<Record<QaScopePage, MotionLayoutDeformPageSpec>>({
  business: { shellHeight: shellDebugPopoverContentMinHeight },
  common: { shellHeight: shellDebugPopoverContentMinHeight },
});

const {
  activePage,
  shellHeight,
  contentExiting,
  contentEntering,
  contentDirection,
  switchTo,
} = useMotionLayoutDeformPageSwitch<QaScopePage>(pageSpecs, 'business');

const displayScenarios = computed(() =>
  activePage.value === 'business'
    ? businessScenarios.value
    : commonScenarios.value,
);

const emptyStateText = computed(() =>
  activePage.value === 'business' ? '当前业务无测试' : '当前无通用测试',
);

const deformContentClass = computed(() => [
  MOTION_LAYOUT_DEFORM_CONTENT,
  styles.deformContent,
  contentDirection.value,
  contentExiting.value && MOTION_LAYOUT_DEFORM_CONTENT_EXITING,
  contentEntering.value && MOTION_LAYOUT_DEFORM_CONTENT_ENTERING,
]);

const scrollViewportMax = computed(() => {
  const metaHeight = metaRef.value?.offsetHeight ?? 0;
  return Math.max(80, shellDebugPopoverContentMaxHeight - metaHeight);
});

const activeRawHeight = computed(() =>
  activePage.value === 'business'
    ? businessRawHeight.value
    : commonRawHeight.value,
);

/** 仅当测量高度超过 content 区 max 时才启用内层滚动。 */
const activeNeedsScroll = computed(
  () => activeRawHeight.value > scrollViewportMax.value,
);

/** 换页 morph 期间冻结 scroll 布局，避免 data-qa-needs-scroll 瞬间切换导致外层 adaptive Popover 跳高。 */
const displayedNeedsScroll = ref(activeNeedsScroll.value);

watch(
  [activeNeedsScroll, contentExiting, contentEntering],
  () => {
    if (!contentExiting.value && !contentEntering.value) {
      displayedNeedsScroll.value = activeNeedsScroll.value;
    }
  },
  { immediate: true },
);

const deformShellStyle = computed(() => {
  if (!shellMeasureReady.value) {
    return undefined;
  }
  return { height: `${shellHeight.value}px` };
});

function resolveMetaHeight(): number {
  return metaRef.value?.offsetHeight ?? 0;
}

function resolveDeformMinShellHeight(): number {
  return Math.max(80, shellDebugPopoverContentMinHeight - resolveMetaHeight());
}

function clampDeformShellHeight(raw: number): number {
  const min = resolveDeformMinShellHeight();
  const max = Math.max(min, scrollViewportMax.value);
  return Math.min(Math.max(raw, min), max);
}

function readMeasureHeight(el: HTMLElement | null): number {
  if (!el) {
    return resolveDeformMinShellHeight();
  }
  return Math.max(Math.ceil(el.getBoundingClientRect().height), 80);
}

function measurePageSpecs() {
  commonRawHeight.value = readMeasureHeight(commonMeasureRef.value);
  businessRawHeight.value = readMeasureHeight(businessMeasureRef.value);

  pageSpecs.common.shellHeight = clampDeformShellHeight(commonRawHeight.value);
  pageSpecs.business.shellHeight = clampDeformShellHeight(businessRawHeight.value);
}

function syncPageSpecHeights() {
  measurePageSpecs();

  if (!contentExiting.value && !contentEntering.value) {
    shellHeight.value = pageSpecs[activePage.value].shellHeight;
  }

  shellMeasureReady.value = true;

  nextTick(() => {
    updateScrollScrim();
  });
}

function ensureTopToolHead() {
  const popover = shellRef.value?.closest('.eds-popover');
  const topTool = popover?.querySelector<HTMLElement>('[class*="topTool"]');
  const title = topTool?.querySelector<HTMLElement>('[class*="topToolTitle"]');
  if (!topTool || !title) {
    topToolHeadTarget.value = null;
    return;
  }

  const existingHead = title.closest(`.${QA_TOP_TOOL_HEAD_CLASS}`);
  if (existingHead instanceof HTMLElement) {
    topToolHeadTarget.value = existingHead;
    return;
  }

  const head = document.createElement('div');
  head.className = QA_TOP_TOOL_HEAD_CLASS;
  topTool.insertBefore(head, title);
  head.appendChild(title);
  topToolHeadTarget.value = head;
}

function teardownTopToolHead() {
  const head = topToolHeadTarget.value;
  const title = head?.querySelector<HTMLElement>('[class*="topToolTitle"]');
  if (head && title && head.parentElement) {
    head.parentElement.insertBefore(title, head);
    head.remove();
  }
  topToolHeadTarget.value = null;
}

let shellResizeObserver: ResizeObserver | undefined;

onMounted(() => {
  nextTick(() => {
    ensureTopToolHead();
    syncPageSpecHeights();
  });

  const shell = shellRef.value;
  if (shell) {
    shellResizeObserver = new ResizeObserver(() => {
      syncPageSpecHeights();
    });
    shellResizeObserver.observe(shell);
  }
});

onBeforeUnmount(() => {
  shellResizeObserver?.disconnect();
  teardownTopToolHead();
});

watch(segmentedIndex, async (index) => {
  const next: QaScopePage = index === 0 ? 'business' : 'common';
  await nextTick();
  measurePageSpecs();
  switchTo(next);
});

watch(
  [commonScenarios, businessScenarios],
  () => {
    nextTick(syncPageSpecHeights);
  },
  { deep: true },
);

watch(lastAppliedId, () => {
  nextTick(syncPageSpecHeights);
});

async function applyScenario(id: string, apply: () => void | Promise<void>) {
  await apply();
  lastAppliedId.value = id;
}
</script>

<template>
  <div
    ref="shellRef"
    :class="[styles.shell, 'shell-debug-qa-popover']"
    :data-qa-needs-scroll="displayedNeedsScroll ? '' : undefined"
  >
    <Teleport v-if="topToolHeadTarget" :to="topToolHeadTarget">
      <div :class="styles.scopeControl">
        <EgSegmented
          v-model="segmentedIndex"
          size="md"
          item-width-mode="fixed"
          :labels="[...QA_SCOPE_LABELS]"
        />
      </div>
    </Teleport>

    <div
      class="motion-layout-deform eds-motion-layout-deform"
      :class="[
        styles.deformShell,
        displayedNeedsScroll && styles.deformShellScrollable,
      ]"
      :data-shell-ready="shellMeasureReady || undefined"
      :style="deformShellStyle"
    >
      <div :class="deformContentClass">
        <div
          ref="scrollRef"
          :class="[
            styles.root,
            displayScenarios.length === 0 && styles.rootEmpty,
            displayedNeedsScroll && styles.rootScrollable,
            displayedNeedsScroll && bottomScrim && styles.rootScrollFadeBottom,
          ]"
        >
          <div v-if="displayScenarios.length === 0" :class="styles.emptyStateBlock">
            <span :class="styles.emptyStateIcon" aria-hidden="true">
              <EgIcon name="eds-coffee" size="sm" />
            </span>
            <p :class="styles.emptyStateText">
              {{ emptyStateText }}
            </p>
          </div>

          <ul v-else :class="styles.itemList">
            <li
              v-for="scenario in displayScenarios"
              :key="scenario.id"
              :class="styles.itemRow"
            >
              <div :class="styles.itemText">
                <p :class="styles.itemLabel">
                  <span :class="styles.itemLabelDot" aria-hidden="true" />
                  <span :class="styles.itemLabelText">{{ scenario.label }}</span>
                </p>
                <p v-if="scenario.description" :class="styles.itemDesc">
                  {{ scenario.description }}
                </p>
              </div>
              <EgButton
                tone="decor"
                variant="outline"
                size="sm"
                @click="applyScenario(scenario.id, scenario.apply)"
              >
                执行
              </EgButton>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <p v-if="lastAppliedId" ref="metaRef" :class="styles.meta">上次执行：{{ lastAppliedId }}</p>

    <div :class="styles.measureHost" aria-hidden="true">
      <div ref="commonMeasureRef" :class="styles.measurePanel">
        <div v-if="commonScenarios.length === 0" :class="styles.emptyStateBlock">
          <span :class="styles.emptyStateIcon" aria-hidden="true">
            <EgIcon name="eds-coffee" size="sm" />
          </span>
          <p :class="styles.emptyStateText">
            {{ emptyStateText }}
          </p>
        </div>
        <ul v-else :class="styles.itemList">
          <li
            v-for="scenario in commonScenarios"
            :key="`measure-common-${scenario.id}`"
            :class="styles.itemRow"
          >
            <div :class="styles.itemText">
              <p :class="styles.itemLabel">
                <span :class="styles.itemLabelDot" aria-hidden="true" />
                <span :class="styles.itemLabelText">{{ scenario.label }}</span>
              </p>
              <p v-if="scenario.description" :class="styles.itemDesc">
                {{ scenario.description }}
              </p>
            </div>
            <EgButton tone="decor" variant="outline" size="sm" tabindex="-1">
              执行
            </EgButton>
          </li>
        </ul>
      </div>

      <div ref="businessMeasureRef" :class="styles.measurePanel">
        <div v-if="businessScenarios.length === 0" :class="styles.emptyStateBlock">
          <span :class="styles.emptyStateIcon" aria-hidden="true">
            <EgIcon name="eds-coffee" size="sm" />
          </span>
          <p :class="styles.emptyStateText">
            当前业务无测试
          </p>
        </div>
        <ul v-else :class="styles.itemList">
          <li
            v-for="scenario in businessScenarios"
            :key="`measure-business-${scenario.id}`"
            :class="styles.itemRow"
          >
            <div :class="styles.itemText">
              <p :class="styles.itemLabel">
                <span :class="styles.itemLabelDot" aria-hidden="true" />
                <span :class="styles.itemLabelText">{{ scenario.label }}</span>
              </p>
              <p v-if="scenario.description" :class="styles.itemDesc">
                {{ scenario.description }}
              </p>
            </div>
            <EgButton tone="decor" variant="outline" size="sm" tabindex="-1">
              执行
            </EgButton>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
