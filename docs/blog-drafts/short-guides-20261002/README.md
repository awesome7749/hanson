# Five short Hanson Home blog drafts

Created October 2, 2026. **Unpublished; no production deployment.**

Five topics, each in English, Spanish, Simplified Chinese and Brazilian Portuguese. About 300–350 English body words each (roughly a three-minute read). These do not repeat the brand guide, winter guide, maintenance post, pending cold-room draft, or skipped electrical-panel draft.

| Topic | English | Español | 中文 | Português |
| --- | --- | --- | --- | --- |
| Before Your Heat-Pump Quote: Make the Most of a Mass Save Assessment | [English](mass-save-assessment-before-heat-pump.md) | [Español](mass-save-assessment-before-heat-pump-es.md) | [中文](mass-save-assessment-before-heat-pump-zh.md) | [Português](mass-save-assessment-before-heat-pump-pt.md) |
| Thinking About a HEAT Loan? Start Before Installation | [English](heat-loan-before-heat-pump-installation.md) | [Español](heat-loan-before-heat-pump-installation-es.md) | [中文](heat-loan-before-heat-pump-installation-zh.md) | [Português](heat-loan-before-heat-pump-installation-pt.md) |
| Does a Mini-Split Bring Fresh Air Into Your Home? | [English](mini-split-fresh-air-ventilation.md) | [Español](mini-split-fresh-air-ventilation-es.md) | [中文](mini-split-fresh-air-ventilation-zh.md) | [Português](mini-split-fresh-air-ventilation-pt.md) |
| Heat Pumps and Power Outages: Make a Simple Plan Before the Storm | [English](heat-pump-power-outage-plan.md) | [Español](heat-pump-power-outage-plan-es.md) | [中文](heat-pump-power-outage-plan-zh.md) | [Português](heat-pump-power-outage-plan-pt.md) |
| A Quieter Heat-Pump Installation Starts With the Outdoor Location | [English](quieter-heat-pump-outdoor-unit-placement.md) | [Español](quieter-heat-pump-outdoor-unit-placement-es.md) | [中文](quieter-heat-pump-outdoor-unit-placement-zh.md) | [Português](quieter-heat-pump-outdoor-unit-placement-pt.md) |

## Local review

Run the review build from the repository root:

```sh
REACT_APP_DEPLOYMENT_MODE=preview REACT_APP_BLOG_DRAFT_PREVIEW=true BUILD_PATH=build-draft-preview GENERATE_SOURCEMAP=false npm run build --prefix my-app
```

Serve `my-app/build-draft-preview` with an SPA fallback and open `/blog/drafts`. The existing language switcher changes editions and retains matching section anchors. Drafts are available only when the preview flag is explicitly enabled and deployment mode is not live. Local review pages are noindex. A normal or live build excludes draft content. The public article list, prerenderer and sitemap remain unchanged.

## Release one topic at a time

After the user approves a specific topic, move that topic’s English edition into `blogArticles.json` and its three translations into `blogTranslations.json`, remove `status: draft`, and set the actual publication date. Remove only that group from `blogDrafts.json`. Run the normal build/tests and deploy through the verified production workflow. Other groups remain hidden. Recheck Mass Save requirements, deadlines and any updated public-safety guidance before release.

A possible editorial sequence is assessment → financing → fresh air → outdoor location → outage planning, with two or more days between releases. No dates or automatic publication are scheduled by this batch.

## Research and visuals

Official Mass Save, EPA, Massachusetts public-safety and PNNL resources were reviewed October 2, 2026. No fixed rebate/loan amount is promised. The official loan sources display inconsistent legacy maximums, so the financing article directs readers to confirm current terms. Original SVGs show the HEAT Loan steps and mini-split air path in all four languages, with mobile versions. Two articles use previously supplied Hanson Home installation photos with credit.
