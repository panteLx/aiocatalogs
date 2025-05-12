/**
 * Shared templates for the configuration page
 *
 * This file contains HTML templates that can be used by Cloudflare and future implementations.
 * It serves as an integration point for the smaller, more maintainable component files.
 */
import { getMDBListSearchFormHTML } from './mdblistTemplates';
import { getConfigPageHeaderHTML } from './configPageHeader';
import { getAddCatalogFormHTML } from './addCatalogComponent';
import { getMDBListApiConfigHTML } from './mdblistComponent';
import { getCatalogListHTML } from './catalogListComponent';
import { getAddonInstallationHTML } from './addonInstallComponent';
import { getSponsorBannerHTML } from './sponsorComponent';
import { getFooterHTML } from './footerComponent';
import { getPageScriptsHTML } from './pageScriptsComponent';
import { getHTMLHead, getBodyOpeningHTML, getBodyClosingHTML } from './pageStructureComponents';
import { getHomePageHTML } from './homePageTemplate';
export { convertStremioUrl } from './utilities';

/**
 * Creates the HTML for the configuration page
 */
export function getConfigPageHTML(
  userId: string,
  catalogs: any[],
  baseUrl: string,
  message: string = '',
  error: string = '',
  isCloudflare: boolean = false,
  packageVersion: string = '1.0.0',
  apiKey: string = ''
) {
  // Add MDBList search form if API key is available
  const mdblistSearchForm = apiKey ? getMDBListSearchFormHTML(userId) : '';

  // Build the page by combining the components
  return `
    ${getHTMLHead('AIOCatalogs - Configuration')}
    ${getBodyOpeningHTML(userId)}
    ${getConfigPageHeaderHTML(userId)}
    ${getSponsorBannerHTML()}
    
    <div class="grid gap-8">
      ${getAddCatalogFormHTML(userId)}
      ${apiKey ? getMDBListApiConfigHTML(userId, apiKey) : ''}
      ${mdblistSearchForm}
      ${getCatalogListHTML(userId, catalogs)}
      ${getAddonInstallationHTML(userId, baseUrl)}
    </div>
    
    ${getFooterHTML(packageVersion)}
    ${getPageScriptsHTML(message, error)}
    ${getBodyClosingHTML()}
  `;
}

// Re-export the home page HTML function
export { getHomePageHTML };
