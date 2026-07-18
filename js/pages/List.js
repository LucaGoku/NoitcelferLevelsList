import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <button @click="showFilters = !showFilters" class="toggle-filters-button">{{ showFilters ? 'Hide Filters' : 'Show Filters' }}</button>
                <div class="filter-container" v-show="showFilters">
                    <input type="text" v-model="searchQuery" placeholder="Search levels...">
                    <div class="tag-filters">
                        <div class="tag-filter-options">
                            <label><input type="radio" v-model="tagFilterMode" value="OR"> ANY</label>
                            <label><input type="radio" v-model="tagFilterMode" value="AND"> ALL</label>
                        </div>
                        <div class="tag-list">
                            <label v-for="tag in allTags" :key="tag">
                                <input type="checkbox" :value="tag" v-model="selectedTags"> {{ tag }}
                            </label>
                        </div>
                    </div>
                </div>
                <table class="list" v-if="filteredList.length > 0">
                    <tr v-for="([level, err], i) in filteredList">
                        <td class="rank">
                            <p v-if="level.originalRank <= 150" class="type-label-lg">#{{ level.originalRank }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || 'Error (' + err + '.json)' }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
                <div v-else>
                    <p>No levels found.</p>
                </div>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <div class="tags" v-if="level.tags && level.tags.length > 0">
                        <span v-for="tag in level.tags" class="tag">{{ tag }}</span>
                    </div>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">FPS</div>
                            <p>{{ level.fps || '60' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected +1 <= 150"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="'/assets/phone-landscape'+ (appStore.dark ? '-dark' : '') + '.svg'" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="'/assets/' + roleIconMap[editor.role] + (appStore.dark ? '-dark' : '') + '.svg'" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>List Requirements</h3>
                    <p>
                        The difficulty must be almost all in the spam of the level. You are allowed to put a triple spike or a timing at the end or beginning.
                    </p>
                    <p>
                        You are not allowed to use methods of spamming that require little effort for very high amounts of cps, such as drag clicking, bolt clicking.
                    </p>
                    <p>
                        The lowest respawn time is 0.5 seconds.
                    </p>
                    <p>
                        A maximum of 2 inputs are allowed when spamming.
                    </p>
                    <p>
                        You must not use capped hardware to spam as it gives an unfair advantage at frame perfect spam.
                    </p>
                    <p>
                        Rebinding keys IS allowed as long as you use only 2 or less keys!
                    </p>
                    <p>
                        It may say Spam "Challenge" List, however there is not really a time limit.
                    </p>
                    <p>
                        Once a level falls onto the Legacy List, we accept records for it for 24 hours after it falls off, then afterwards we never accept records for said level
                    </p>
                    <p>
                        Only levels that have 15 CPS frame perfect spam are allowed on the list. Higher FPS like 120 FPS (twice the FPS) or harder methods like jitterclicking are allowed to make the level harder.
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
        searchQuery: '',
        selectedTags: [],
        tagFilterMode: 'OR',
        allTags: [],
        showFilters: true
    }),
    computed: {
        level() {
            return this.filteredList[this.selected] ? this.filteredList[this.selected][0] : null;
        },
        video() {
            if (!this.level) return;
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        filteredList() {
            let list = this.list;

            // Search query filter
            if (this.searchQuery) {
                list = list.filter(([level, err]) => {
                    return level && level.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                });
            }

            // Tag filter
            if (this.selectedTags.length > 0) {
                list = list.filter(([level, err]) => {
                    if (!level || !level.tags) {
                        return false;
                    }
                    if (this.tagFilterMode === 'OR') {
                        return this.selectedTags.some(tag => level.tags.includes(tag));
                    } else { // AND
                        return this.selectedTags.every(tag => level.tags.includes(tag));
                    }
                });
            }

            return list;
        },
        appStore() {
            return store;
        }
    },
    watch: {
        searchQuery() {
            this.selected = 0;
        },
        selectedTags() {
            this.selected = 0;
        },
        tagFilterMode() {
            this.selected = 0;
        }
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        if (this.list) {
            const allTags = new Set();
            this.list.forEach(([level, err]) => {
                if (level && level.tags) {
                    level.tags.forEach(tag => allTags.add(tag));
                }
            });
            this.allTags = Array.from(allTags).sort();
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
    },
};
