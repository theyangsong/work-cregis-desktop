<script setup lang="ts">
import { EgAvatar } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import DetailProgressMemberDeviceInfoTrigger from './DetailProgressMemberDeviceInfoTrigger.vue';
import type { ApprovalProgressMember } from '../approval/types';
import styles from './DetailApprovalProgressTimeline.module.css';

defineProps<{
  members: ApprovalProgressMember[];
  listKey: string;
}>();

const { ui } = useAppI18n();

function memberDisplayName(member: ApprovalProgressMember): string {
  return member.avatarVariant === 'robot' ? ui(member.name) : member.name;
}
</script>

<template>
  <ul v-if="members.length" :class="styles.members">
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
