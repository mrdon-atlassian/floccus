# Confluence Bookmarks
> Sync your browser bookmarks with Confluence

The goal of this project is to build a browser extension that syncs your browser data with [Atlassian Confluence](https://www.atlassian.com/software/confluence).  It is based on [Floccus](https://github.com/marcelklehr/floccus) by Marcel Klehr.

This browser extension is functional, but highly experimental, especially for multiple installations.

## Install
This installation assumes you have an instance of Confluence Cloud active and available.  It has only been tested on Firefox but should work with Chrome as well.

**Note:** It is recommended to not enable native bookmark synchronization built into your browser, as it is known to cause issues.

The extension is available for file installation on [EAC](https://extranet.atlassian.com/display/~don@atlassian.com/Confluence+Bookmarks+Browser+Extension)


## Usage
 * **The options panel**; After installation the options pane will pop up allowing you to create accounts and edit their settings. You will be able to access this pane at all times by clicking the icon in the browser tool bar.
 * **Your accounts**: You can setup multiple Confluence Bookmark accounts and select a bookmark folder for each, that should be synced with that account. Confluence Bookmarks will keep the bookmarks in sync with your Confluence page whenever you add or change them and will also sync periodically to pull the latest changes from the server.
 * **API Tokens**: API tokens can be generated for your Atlassian account at 
 [https://id.atlassian.com/manage/api-tokens](https://id.atlassian.com/manage/api-tokens) 
 * **Page IDs**: To specify the page you want to sync the bookmarks against, visit the page in your browser and note the numeric ID in the URL.  Copy that value into the "Page ID" option field.
 * **Syncing the root folder**: If you want to sync all bookmarks in your browser you need to select the topmost untitled folder in the folder picker. Syncing the root folder across browsers from different vendors is not possible currently, as the main bookmark folders (like "Other bookmarks") are hardcoded and different for each browser vendor.

### Limitations
 * Note that currently you cannot sync the same folder with multiple Confluence pages in order to avoid data corruption. If you sync the root folder with one account and sync a sub folder with a different account, that sub-folder will not be synced with the account connected to the root folder anymore.
 * Confluence Bookmarks yields an error if you attempt to sync a folder with duplicate bookmarks (two or more bookmarks of the same URL). Remove one of the bookmarks for Confluence Bookmarks to resume normal functionality.
 * Syncing the root folder across browsers from different vendors is not possible currently, as the main bookmark folders (like "Other bookmarks") are hardcoded and different for each browser vendor.

