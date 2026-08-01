<script setup lang="ts">
import { EgFormSubmission } from '@eds/desktop-components';
import { useAppI18n } from '@/composables/useAppI18n';
import {
  signingMpcNetworkErrorOptions,
} from './signingMpcNetworkError.constants';
import SigningMpcNetworkItemRow from './SigningMpcNetworkItemRow.vue';
import styles from './SigningMpcNetworkErrorPanel.module.css';

const { ui } = useAppI18n();

const selectedIndex = defineModel<number | null>('selectedIndex', { default: null });

function selectNetwork(index: number) {
  selectedIndex.value = index;
}
</script>

<template>
  <section :class="styles.root" aria-labelledby="signing-mpc-network-title">
    <div :class="styles.titleBlock">
      <h2 id="signing-mpc-network-title" :class="styles.title">
        {{ ui('Network anomaly') }}
      </h2>

      <EgFormSubmission
        :class="styles.formSubmission"
        type="danger"
        :text="ui('Signing failed. Please check the MPC network status and try again.')"
      />
    </div>

    <div
      :class="styles.networkList"
      role="radiogroup"
      :aria-label="ui('MPC Network')"
    >
      <SigningMpcNetworkItemRow
        v-for="(network, index) in signingMpcNetworkErrorOptions"
        :key="network.key"
        :label="network.label"
        :latency-label="network.latencyLabel"
        :latency-color="network.latencyColor"
        :selected="selectedIndex === index"
        radio-name="signing-mpc-network-error"
        :radio-value="network.key"
        @select="selectNetwork(index)"
      />
    </div>
  </section>
</template>
