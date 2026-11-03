<script lang="ts">
  import "@johnmorrisdotca/kuni/element/define";

  let { code = "JP" }: { code?: string } = $props();
</script>

<kuni-card {code} fields="name codes capital"></kuni-card>
