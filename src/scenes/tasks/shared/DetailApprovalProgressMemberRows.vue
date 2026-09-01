<script setup lang="ts">
import { EgAvatar } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import DetailProgressMemberDeviceInfoTrigger from './DetailProgressMemberDeviceInfoTrigger.vue';
import type { ApprovalProgressMember } from '../approval/types';
import styles from './DetailApprovalProgressTimeline.module.css';

withDefaults(
  defineProps<{
    members: ApprovalProgressMember[];
    listKey: string;
    presentation?: 'acted-rows' | 'pending-inline';
  }>(),
  {
    presentation: 'acted-rows',
  },
);

const { ui } = useAppI18n();

function memberDisplayName(member: ApprovalProgressMember): string {
  return member.avatarVariant === 'robot' ? ui(member.name) : member.name;
}
</script>

<template>
  <div
    v-if="members.length && presentation === 'pending-inline'"
    :class="styles.pendingMembers"
  >
    <template
      v-for="(member, index) in members"
      :key="`${listKey}-${member.emailMasked || member.name}`"
    >
      <span v-if="index > 0" :class="styles.pendingMemberSeparator" aria-hidden="true">/</span>
      <span :class="styles.pendingMember">
        <EgAvatar
          size="xs"
          :name="member.avatarName"
          :variant="member.avatarVariant ?? 'initials'"
        />
        <span :class="styles.memberText">
          {{ memberDisplayName(member) }}
          <span v-if="!member.hideEmail && member.emailMasked" :class="styles.memberEmail">
            {{ member.emailMasked }}
          </span>
        </span>
      </span>
    </template>
  </div>

  <ul v-else-if="members.length" :class="styles.members">
    <li
      v-for="member in members"
      :key="`${listKey}-${member.emailMasked || member.name}`"
      :class="styles.member"
    >
      <div :class="styles.memberMain">
        <div :class="styles.memberLead">
          <EgAvatar
            size="xs"
            :name="member.avatarName"
            :variant="member.avatarVariant ?? 'initials'"
          />
          <span :class="styles.memberText">
            {{ memberDisplayName(member) }}
            <span v-if="!member.hideEmail && member.emailMasked" :class="styles.memberEmail">
              {{ member.emailMasked }}
            </span>
            <DetailProgressMemberDeviceInfoTrigger
              v-if="member.deviceInfo"
              :device-info="member.deviceInfo"
            />
          </span>
        </div>
        <time
          v-if="member.atDisplay"
          :class="styles.stepAt"
          :datetime="member.atDisplay"
        >
          {{ member.atDisplay }}
        </time>
      </div>
      <p v-if="member.remark" :class="styles.memberRemark">
        {{ ui(member.remark) }}
      </p>
    </li>
  </ul>
</template>
