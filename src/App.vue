<template>
  <div>
    <label>xml<input type="radio" value="xml" v-model="view" /></label>
    <label>table<input type="radio" value="table" v-model="view" /> </label>
  </div>

  <template v-if="view === 'xml'">
    <h2>XML</h2>
    <button @click="updateXml">Generate XML</button>
    <pre> {{ xml }} </pre>
  </template>

  <template v-else>
    <h2>Grouped table</h2>

  <fieldset>
    <legend>Group by:</legend>
      <label><input type="radio" value="category" v-model="groupBy" /> category</label>
      <label><input type="radio" value="currency" v-model="groupBy" /> currency</label>
      <label><input type="radio" value="account" v-model="groupBy" /> account</label>
  </fieldset>

    <table>
      <thead>
        <tr class="header">
          <td v-for="header in headers" :key="header">
            {{ header }}
          </td>
        </tr>
      </thead>
      <tbody>
        <template
          v-for="([key, value], idx) in Object.entries(groupedData)"
          :key="idx"
        >
          <tr @click="groupToggle(key)" class="group">
            <td>
              <div style="display: flex; justify-content: space-between">
                <span>{{ key }}</span>
              </div>
            </td>
          </tr>

          <template v-if="!hidden.has(key)">
            <tr v-for="(row, idx) in value" :key="idx">
              <td v-for="(cellValue, cellKey) in row" :key="cellKey">
                {{ cellValue }}
              </td>
            </tr>

            <tr v-if="value.length > 1">
              <td style="text-align: right">
                <span v-if="value.length > 1">
                  total: {{ totalGet(value) }}PLN
                </span>
              </td>
            </tr>
          </template>
        </template>
      </tbody>
    </table>
  </template>

  <table>
    <tr v-for="(item, idx) in data" :key="idx">
      <td v-for="(_, key) in item" :key="key">
        <input type="text" v-model="item[key]" />
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { dataGroup, toXml, useExampleData } from "./utils";

const view = ref<"xml" | "table">("table");

type Data = {
  category: string;
  amount: string;
  currency: string;
  [key: string]: string;
};

const data = useExampleData<Data>();

// TODO: TASK → avoid recomputing while user is still typing ---Done
const xml = ref("");
const updateXml = () => {
  xml.value = toXml(data.value ?? []);
}

// TODO: TASK → let the user also group by currency and account ---Done
const groupBy = ref<keyof Data>('category');

const groupedData = computed(() =>
  data.value 
    ? dataGroup(data.value, groupBy.value)
    : [],
);

const headers = computed(() =>
  Object.keys(data.value?.[0] ?? {}).filter(key => key !== groupBy.value),
);



const hidden = reactive(new Set<string>());
function groupToggle(groupKey: string) {
  hidden.has(groupKey) //
    ? hidden.delete(groupKey)
    : hidden.add(groupKey);
}

// TODO: TASK → handle different currencies. Use `plnToCurrency` function to get the rates ---Done
async function totalGet(items: { amount: string | number; currency: string }[]) {
  let total = 0;

  for (const item of items) {
    const rate = await plnToCurrency(item.currency.toLowerCase());
    const amount = Number(item.amount);

    total += amount / rate;
  }

  return total.toFixed(2); 
}


// @ts-ignore
async function plnToCurrency(curr: string) {
  if (curr === "pln") return 1;

  const res = await fetch(
    `http://localhost:5173/currency/pln-to-${curr.toLowerCase()}`,
  );
  const text = await res.text();
  return Number(text.trim());
}
</script>

<style scoped>
pre {
  text-align: left;
}
</style>
