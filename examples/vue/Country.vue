<script setup lang="ts">
import "@johnmorrisdotca/kuni/element/define";

withDefaults(defineProps<{ code?: string }>(), { code: "JP" });
</script>

<template>
  <kuni-card :code="code" fields="name codes capital"></kuni-card>
</template>
