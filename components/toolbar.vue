<script>
export default {
    name: 'toolbar',
    props: {
        year: {
            type: Number,
            required: true,
        },
        category: {
            type: String,
            required: true,
        }
    },
    watch: {
        year(newYear) {
            this.updateYear(newYear)
        },
        category(newCategory) {
            this.updateCategory(newCategory)
        },
    },
    data() {
        return {
            yearOptions: [2016,2015,2014,2013,2012,2011,2010,2009,2008].map(year => ({
                value: year,
                text: year,
            })),
            categoryOptions: [
                {
                    value: 'hf_score',
                    text: 'Human Freedom (hf)',
                },
                {
                    value: 'pf_score',
                    text: 'Personal Freedom (pf)',
                },
                {
                    value: 'ef_score',
                    text: 'Economic Freedom (ef)',
                },
            ],
            selectedYear: this.year,
            selectedCategory: this.category,
        }
    },
    methods: {
        updateYear(year) {
            this.selectedYear = year
        },
        updateCategory(category) {
            this.selectedCategory = category
        }
    }
}
</script>

<template>
    <b-navbar class="mb-3" variant="light">
        <b-navbar-nav>
            <b-nav-form>
                <b-nav-text class="mr-3 text-dark">Year:</b-nav-text>
                <b-form-select v-model="selectedYear" class="mr-3" :options="yearOptions" @change="$emit('change-year', selectedYear)"></b-form-select>
            </b-nav-form>
            <b-nav-form>
                <b-nav-text class="mr-3 text-dark">Score:</b-nav-text>
                <b-form-select v-model="selectedCategory" :options="categoryOptions" @change="$emit('change-category', selectedCategory)"></b-form-select>
            </b-nav-form>
        </b-navbar-nav>
        <b-navbar-nav class="mx-auto">
            <b-nav-text class="text-dark">
                Freedom Score Dashboard
            </b-nav-text>
        </b-navbar-nav>
        <b-navbar-nav class="ml-auto">
            <b-nav-form>
                <b-button variant="danger" @click="$emit('reset')">
                    Reset selections
                </b-button>
            </b-nav-form>
        </b-navbar-nav>
    </b-navbar>
</template>

<style scoped>

</style>