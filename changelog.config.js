import config from 'conventional-changelog-conventionalcommits';

export default config({
    "types": [
        { "type": "feat", "section": "Features" },
        { "type": "fix", "section": "Bug Fixes" },
        { "type": "refactor", "section": "Refactorings" }
    ]
})