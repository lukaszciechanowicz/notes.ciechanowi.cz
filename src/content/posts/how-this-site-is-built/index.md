---
title: A blog I don’t have to babysit
description: Astro builds it, GitHub Actions checks and ships it, GitHub Pages serves it, and Cloudflare handles DNS. A small blog, everything as code.
slug: a-blog-i-dont-have-to-babysit
pubDate: 2026-10-17
tags: [Web, Automation]
readingMinutes: 13
sketch: notebook
---

<nav class="toc" aria-label="Article sections"><a href="#hosting">The hosting</a><a href="#framework">Why a framework</a><a href="#writing">Writing a post</a><a href="#pictures">The drawings</a><a href="#actions">The pipeline</a><a href="#testing">The checks</a><a href="#sources">Sources</a></nav>
<p>Not every post gets to involve a firewall quietly eating half an Internet connection. This one is less dramatic: it is about how I built the place where I write about those things.</p>
<p>It is not the most spectacular project on this blog. But I know <a class="friend-link" href="https://www.linkedin.com/in/leszekwalerys/">Lechu</a>, <a class="friend-link" href="https://www.linkedin.com/in/marcinpetrow/">Maniek</a> and <a class="friend-link" href="https://www.linkedin.com/in/patryk-pospiech/">Patryk</a> will need something similar, so I might as well write it down once instead of explaining the same setup three times. This one is partly for you, gents.</p>
<p>I wanted a small, personal site. Comfortable to read. A little odd around the edges. Somewhere for enterprise-cloud problems, automation, things made from LEGO, and the occasional photograph that does not need an entire article.</p>
<p>I did not want to acquire another application to operate just so I could publish some paragraphs.</p>
<section id="hosting"><h2>Four pieces. Four different jobs.</h2>
<p>The site lives in <a href="https://github.com/lukaszciechanowicz/notes.ciechanowi.cz">this GitHub repository</a> and is published at notes.ciechanowi.cz. The important distinction is that GitHub Pages is the <em>host</em>, not the program that understands my article templates.</p>
<p><a href="https://www.cloudflare.com/">Cloudflare</a> comes first, at DNS. I put the domain there partly because it is useful, partly because I like having somewhere to do a little infrastructure magic: change things, add records, call an API, and see what else I can make it do. There is room to play with rules and other edge features later. In the setup published here, though, the hostname points straight to GitHub Pages: it is <a href="https://developers.cloudflare.com/dns/proxy-status/">DNS-only, not an active Cloudflare HTTP proxy</a>. Cloudflare Pages is a different product; it is not hosting this blog.</p>
<ul><li><strong>Cloudflare handles DNS.</strong> It gives me control over the domain’s records, with <a href="https://developers.cloudflare.com/fundamentals/api/">APIs for programmatic changes</a> when I want to go beyond clicking around a dashboard.</li><li><strong><a href="https://astro.build/">Astro</a> builds the site.</strong> It reads the content, applies my layouts, produces the article pages and lists, and processes the images I ask it to process.</li><li><strong>GitHub Actions runs the publishing workflow.</strong> It installs the dependencies, checks the project, builds it and hands the resulting artifact to the deployment job.</li><li><strong>GitHub Pages serves the result.</strong> Visitors receive HTML, CSS, JavaScript and images. They do not start an Astro application on a server every time they open an article.</li></ul>
<p>The static output is a consequence of this site’s configuration, not a claim about everything Astro can do:</p>
<pre><code>export default defineConfig({
  site: 'https://notes.ciechanowi.cz',
  output: 'static',
  trailingSlash: 'always',
});</code></pre>
<p>The build writes the website into <code>dist/</code>. That is what gets published. The custom domain is configured for GitHub Pages, and the repository carries a <code>public/CNAME</code> file with the hostname. HTTPS is enforced on the published site.</p>
<p>There are obviously still servers. They are just not application servers I maintain for this blog. <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages">GitHub Pages is a static hosting service</a>, and that happens to match what these notes need.</p>
<h3 class="accent">Everything as code</h3>
<p>That is the bit I love. Changes become commits. I get version history, reviewable diffs and automation instead of a growing collection of steps to remember. The site, the content and the publishing workflow live together in the repository; Cloudflare’s API gives me a way to take the same approach beyond the site itself. Less clicking the same thing twice. More describing what I want and letting the machinery repeat it.</p>
</section>
<section id="framework"><h2>Why use a framework for something this small?</h2>
<p>The first versions were plain HTML. That was useful: I could explore the typography, spacing, colours and illustrations without making a publishing-system decision first.</p>
<p>But a collection of prototypes is not a particularly good way to maintain a growing blog. Once there are several articles, I do not want to copy a header into every file, remember to update an index, or manually split an archive into pages. That is bookkeeping, not writing.</p>
<p>I chose <strong><a href="https://astro.build/">Astro</a></strong> because it lets me keep the result close to ordinary HTML while taking over that bookkeeping. The components can render HTML at build time without bringing a client-side framework runtime along for the ride. <a href="https://docs.astro.build/en/basics/astro-components/">That is how Astro’s component model works</a>; I am not using React or Vue here.</p>
<p>This is not a declaration that every other static-site generator is wrong. I was not trying to win a framework tournament. I wanted reusable HTML-like layouts, structured Markdown content, local-image handling and static output. Astro put those things together in a way that fitted the site I had already designed.</p>
<p><strong>The framework did not choose the design.</strong> There is no purchased theme hiding underneath it. The small heading, quiet separators, warm accent and marginal sketches are choices in my templates and CSS.</p>
<p>And “no framework runtime” does not mean “no JavaScript anywhere.” The lightbulb has a small script. It switches the theme and carries an explicit light-theme choice through internal links. An ordinary visit starts dark; an old saved preference does not silently overrule that. I do not need a component application to change some CSS variables.</p>
</section>
<section id="writing"><h2>A post is a folder, not a dashboard</h2>
<p>The published articles live under <code>src/content/posts/</code>. A post can have its own directory, with the text and its local assets together:</p>
<pre><code>src/content/posts/
  my-next-note/
    index.md
    photo.jpg</code></pre>
<p>The Markdown starts with frontmatter. These are fields the site actually knows about, not a second document I have to maintain somewhere else:</p>
<pre><code>---
title: A blog I don't have to babysit
description: A small static site, with a publishing workflow I can explain.
slug: a-blog-i-dont-have-to-babysit
pubDate: 2026-10-17
tags: [Web, Systems]
readingMinutes: 10
---</code></pre>
<p>The date above is example editorial metadata, not a deployment instruction. The title, description and tags feed the page and its listing; the slug gives the article its URL. The reading-time value is explicit in this version of the site, not secretly calculated by Astro.</p>
<p><a href="https://docs.astro.build/en/guides/content-collections/">Content Collections</a> loads the Markdown and applies the schema defined in <code>src/content.config.ts</code>. In this repository, that schema checks for a title, description, date, tags and a positive reading-time value. I would rather discover missing metadata while building than after publishing.</p>
<p>A local image in the body is straightforward:</p>
<pre><code>![A useful view of the thing I am discussing](./photo.jpg)</code></pre>
<p>Images stored in <code>src/</code> can go through Astro’s processing pipeline. Files in <code>public/</code> are copied as they are. I use that distinction deliberately: the pfSense speed-test screenshot lives in <code>public/images/pfsense/</code>, so the original PNG remains available behind the framed image in the article. <a href="https://docs.astro.build/en/guides/images/">Astro documents both paths</a>.</p>
<blockquote><p>A useful trap to avoid: this site does not currently have a <code>draft: true</code> publishing filter. Its collection loader includes the Markdown files in that directory. Keeping an unapproved draft outside the published collection is a workflow decision, not a feature I should assume exists.</p></blockquote>
<p>That is why this post started as a local, standalone HTML review copy. I can read it, change the wording and judge the illustrations before it becomes a content entry. Writing a draft should not be the same action as publishing it.</p>
<h3>The archive should not become an endless front page</h3>
<p>The listing reads the collection, sorts by publication date, uses the entry ID to break ties, and calls <code>paginate(posts, { pageSize: 10 })</code>. The route is <code>src/pages/[...page].astro</code>, so the first page is <code>/</code> and subsequent pages are <code>/2/</code>, <code>/3/</code> and so on.</p>
<p><strong>More →</strong> is a normal link to the next generated page. There is a return link to newer notes, and no next link on the last page. No infinite scroll, no browser-side download of the entire archive so that most of it can then be hidden. <a href="https://docs.astro.build/en/reference/routing-reference/#paginate">Astro’s paginator supplies the page data and URLs</a>.</p>
</section>
<section id="pictures"><h2>I wanted the pictures to belong to this place</h2>
<p>I spent an unreasonable amount of time on the part that is not a framework feature: the drawings.</p>
<p>I wanted an illustration style of my own. Not a collection of unrelated stock images, and not a different visual personality every time I published. Something that could sit next to a firewall investigation, a cloud-automation note or a LEGO contraption and still feel like the same notebook.</p>
<p>The direction I kept was sparse: slightly wandering lines, rounded ends, plenty of empty space, and a few restrained warm marks. More quick pen study than polished enterprise diagram. The drawing should introduce an idea without competing with the text.</p>
<p>For a less abstract example, look at the <a href="/notes/finding-the-missing-gigabit-in-my-pfsense-firewall/#network-diagram">network drawing in the pfSense article</a>. My actual setup, in the same loose lines and warm accent as the rest of the site. That is exactly what I wanted: a technical picture that explains something real and still looks like it belongs here. My setup, my visual language—not a vendor diagram dropped into the middle of a notebook.</p>
<p>These are SVG sketch studies created during the design process, not scans of a paper notebook. Here are some of the actual earlier examples, rather than a mood board pretending to be the work:</p>
<div class="study-grid">
<figure class="study"><div class="drawing"><svg xmlns="http://www.w3.org/2000/svg" class="firewall-sketch" viewBox="0 0 320 180" fill="none" role="img" aria-label="A cloud above a small router, drawn in loose pen strokes">
  <g stroke="var(--fg, currentColor)" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
    <path d="M106 79C91 81 82 73 86 62C88 54 97 51 105 54C103 41 112 31 125 32C137 31 145 39 147 48C154 40 168 41 173 51C183 46 196 49 199 59C210 57 219 64 217 73C216 81 207 83 198 82L112 82"/>
    <path d="M109 86C137 85 167 88 198 85M110 51C112 40 120 36 128 36" opacity=".25" stroke-width=".8"/>
    <path d="M151 84C155 93 147 98 151 107M148 110C132 108 115 109 103 112C100 117 101 138 105 141C126 144 163 142 181 143C186 138 185 119 181 112C173 110 160 111 154 110"/>
    <path d="M109 119C130 121 154 118 178 120M108 113L106 98M177 111L180 97M112 132L115 132M124 132L127 132M137 132L140 132M163 129L164 135M171 130L172 135"/>
    <path d="M108 146C131 147 157 145 177 146" opacity=".25" stroke-width=".8"/>
    <path d="M184 132C198 131 196 151 214 150C231 149 221 128 238 124L247 123M246 117L257 114L263 127L252 132L246 117ZM250 117L250 111L255 110L258 115M251 123L256 121"/>
    <path d="M72 91L65 94M78 102L71 104M226 46L231 40M235 56L243 54" stroke="var(--accent, currentColor)" stroke-width="1.1"/>
  </g>
</svg></div><figcaption><strong>A cloud and a router</strong>The drawing used with the pfSense post: a small object in the margin, not a giant cover competing with the title.</figcaption></figure>
<figure class="study"><div class="drawing"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" fill="none" role="img" aria-labelledby="study-mail-mail-title study-mail-mail-desc">
<title id="study-mail-mail-title">A letterbox with a little curiosity</title>
<desc id="study-mail-mail-desc">An imperfect pen outline of a rounded letterbox, a lifted flag, an envelope and a tiny sensor.</desc>
<g stroke="var(--fg, currentColor)" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
<path d="M103 118L102 70C102 53 112 44 126 45C139 44 148 56 147 71L148 119C134 121 118 118 103 118Z"/>
<path d="M126 45C149 42 174 45 195 44C211 45 219 54 220 69L219 117L150 120M153 113L212 111"/>
<path d="M112 78L137 77M114 82L134 81M112 104C119 102 131 104 138 103M158 59L158 30L179 32L177 45L159 44"/>
<path d="M159 121L160 153M170 121L169 153M147 156C162 153 177 157 186 155"/>
<path d="M54 112L85 108L90 132L60 136Z M55 113L73 123L85 109M61 134L68 124M89 130L78 122"/>
<path d="M196 95C193 90 199 86 203 89C209 92 205 98 201 98C199 98 197 97 196 95ZM200 81C207 80 212 85 213 90M201 74C212 75 218 81 220 88" stroke-width="1.3"/>
<path d="M66 94L62 87M77 93L78 85M231 133L239 137" stroke-width="1.2"/>
</g>
</svg></div><figcaption><strong>The curious letterbox</strong>An earlier Quiet Ledger study. This was one of the loose, understated directions I wanted to carry forward.</figcaption></figure>
<figure class="study"><div class="drawing"><svg xmlns="http://www.w3.org/2000/svg" class="cloud-sketch" viewBox="0 0 320 180" fill="none" role="img" aria-labelledby="study-cloud-cloud-title study-cloud-cloud-desc">
  <title id="study-cloud-cloud-title">Small clouds, repeated work</title>
  <desc id="study-cloud-cloud-desc">Three loosely outlined clouds, a little toothed wheel and a returning arrow suggest the quiet repetition of cloud automation.</desc>
  
  <g stroke="var(--fg, currentColor)" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
    <path d="M81 88C69 89 62 81 65 72C67 64 74 62 82 64C81 52 90 43 101 44C113 44 119 51 121 58C130 50 143 54 146 64C157 59 169 65 168 76C176 79 175 88 167 91C147 93 108 89 87 91"></path>
    <path d="M83 95C107 94 139 96 161 94M87 61C88 53 94 49 101 48" opacity=".25" stroke-width=".8"></path>
    <path d="M115 145C106 145 103 139 106 133C108 128 113 127 118 129C118 121 124 116 132 117C140 116 145 123 145 129C153 124 163 128 163 136C170 136 172 143 166 147L122 148"></path>
    <path d="M207 127C198 128 193 122 196 115C198 109 204 107 210 109C209 100 216 94 223 96C231 95 237 102 237 108C245 105 252 109 252 115C260 115 264 123 258 128C244 131 224 128 212 130"></path>
    <path d="M119 152L158 151M210 134C223 133 241 135 253 133" opacity=".25" stroke-width=".8"></path>
    <path d="M210 39L219 40L220 47L226 50L232 47L238 54L234 60L235 67L242 70L239 79L231 78L226 83L227 90L218 92L215 85L209 83L202 87L196 80L200 74L198 67L191 64L194 55L201 56L207 51L207 44L210 44"></path>
    <path d="M209 69C205 64 209 57 215 57C222 56 226 63 223 69C220 75 212 75 209 69Z"></path>
    <path d="M180 111C189 108 193 97 187 87M182 89L187 85L191 90M151 40C164 31 181 32 192 37" stroke-width="1.2"></path>
    <path d="M62 106L55 109M69 116L65 121M252 48L258 44M260 59L268 59" stroke="var(--accent, currentColor)" stroke-width="1.1"></path>
  </g>
</svg></div><figcaption><strong>Clouds and repeated work</strong>From the later layout exploration: the same visual vocabulary applied to automation. A design study, not a published article.</figcaption></figure>
<figure class="study"><div class="drawing"><svg xmlns="http://www.w3.org/2000/svg" class="shutter-sketch" viewBox="0 0 320 180" fill="none" role="img" aria-labelledby="study-shutter-shutter-title study-shutter-shutter-desc">
  <title id="study-shutter-shutter-title">A camera made of small pieces</title>
  <desc id="study-shutter-shutter-desc">A block-built camera with a six-bladed aperture, a small shutter button and two loose studded bricks, outlined like a quick pen study.</desc>
  
  <g stroke="var(--fg, currentColor)" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
    <path d="M80 133C78 118 80 88 79 74L115 73L121 57L157 56L164 71L207 70C211 86 209 115 210 133C193 135 174 133 161 135M127 135L84 136"></path>
    <path d="M84 140C105 138 118 140 128 139M166 139L205 138M83 91L84 128" opacity=".25" stroke-width=".8"></path>
    <path d="M87 72L87 65L99 65L100 72M105 71L105 65L113 65M179 69L179 61L194 61L195 69M129 64L151 64M88 84L105 84L105 94L88 95L88 84M182 83L199 83M186 89L198 89M87 105L87 122M94 105L94 121"></path>
    <path d="M147 77C162 76 175 88 176 102C177 118 164 132 149 132C132 133 119 120 119 104C117 90 130 77 143 77"></path>
    <path d="M146 82C159 81 171 91 171 104C172 117 161 127 149 127C136 128 124 117 124 105C123 92 134 83 143 82" opacity=".4" stroke-width=".9"></path>
    <path d="M143 94L153 95L159 104L153 113L142 112L137 103L143 94ZM143 94L155 79M153 95L173 96M159 104L166 125M153 113L140 131M142 112L120 111M137 103L128 85" stroke-width="1.25"></path>
    <path d="M231 111L264 110L265 132L232 133L231 111ZM235 110L235 103L243 103L244 110M252 110L252 103L260 103L261 110M237 126L259 125M215 144L245 143L246 161L216 162L215 144ZM220 143L219 137L227 137L228 143M233 143L233 137L241 136L242 142"></path>
    <path d="M64 87L57 84M68 99L60 100M222 50L226 43M231 60L239 57" stroke="var(--accent, currentColor)" stroke-width="1.1"></path>
  </g>
</svg></div><figcaption><strong>A camera made of small pieces</strong>A LEGO-shutter study from the same pass. Again, an illustration experiment—not a claim that the corresponding post already exists.</figcaption></figure>
</div>
<p>The illustration beside this article’s title follows those same rules: a notebook, a folded page, a wandering cable and a small cloud. It suggests the subject without trying to explain the whole deployment pipeline in clip art.</p>
<p>The theme matters here, too. The inline drawings borrow their ink and accent from the page’s CSS variables, so they can live in both palettes. The visual language is mine to keep consistent; Astro is just the machinery that lets me place it in the right template.</p>
<p>Even the full stop in <em>Here be clouds.</em> has a small job: it is a native link to the paragraph explaining the name. That is the scale of ornament I was after. A bit of curiosity, not an interface that wants applause.</p>
</section>
<section id="actions"><h2>GitHub Actions is the publishing assistant, not the host</h2>
<p>I could run a build on my laptop and upload the output myself. The problem is not that this is impossible. It is that I would have to remember which checks I ran and whether the files I uploaded were actually built from the version I intended to publish.</p>
<p>The repository’s <code>.github/workflows/deploy.yml</code> makes that sequence explicit. It runs for pull requests, pushes to <code>main</code>, and manual workflow runs. The build job uses Node 24 and performs:</p>
<pre><code>npm ci
npm run check
npm run build</code></pre>
<p><code>npm ci</code> installs the dependency versions recorded in the lockfile. <code>npm run check</code> invokes <code>astro check</code>. The build then generates the static pages and assets into <code>dist/</code>. The workflow uploads that directory as a Pages artifact, and the separate deployment job publishes the artifact.</p>
<p>Pull requests build and check the site, but do not deploy it. The deployment condition allows only a non-pull-request run on <code>main</code>. In practice, merging a PR publishes the change—and <strong>a direct push to main also publishes it</strong>. The workflow is not a branch-protection rule, and I am not going to pretend that every update is forced through a review gate.</p>
<p>There are a couple of small details I like: the action references are pinned to commits, the build starts with read-only repository permission, and the Pages write permission and identity-token permission are granted to the deployment job. None of that removes the need to maintain dependencies. It makes the intended trust boundary visible.</p>
<p>For my friends borrowing this pattern, there is an important setup step outside the YAML: GitHub Pages must use <strong>GitHub Actions</strong> as its publishing source. The site URL, custom-domain configuration and <code>CNAME</code> must refer to your domain, not mine. <a href="https://docs.astro.build/en/guides/deploy/github/">Astro’s GitHub Pages deployment guide</a> covers that wiring.</p>
</section>
<section id="testing"><h2>A green build is necessary. It is not a design review.</h2>
<p>I separate three questions that are easy to blur together.</p>
<h3>Does the project check and build?</h3>
<p>Those are the automated checks in the workflow. <code>astro check</code> runs diagnostics, including type checking in Astro files; <code>astro build</code> exercises the build-time routes, content and asset processing needed to produce the site. A missing required content field or an unresolved local asset is something I want to catch here.</p>
<h3>Does the built site actually behave correctly?</h3>
<p>For day-to-day editing I can use <code>npm run dev</code>. Before publishing, I also want to look at the production output, not just the development server:</p>
<pre><code>npm run check
npm run build
npm run preview</code></pre>
<p><a href="https://docs.astro.build/en/reference/cli-reference/#astro-preview">The preview command serves the built site locally</a>; it is not the production hosting solution. During this build, the generated files were also served by a plain local static HTTP server. That is a useful sanity check for a site that is supposed to consist of files.</p>
<p>The browser smoke pass covered wide and narrow layouts, dark and light, the lightbulb with mouse and keyboard, theme preservation between pages, full-size image links and the full-stop link into About. For the archive, I also exercised the first-page boundary, the overflow page and its return link with temporary entries. Those entries were removed; they are not fake articles padding the archive.</p>
<p>The visual checks matter. An image can exist in the output and still be badly framed. A page can build and still overflow a phone screen. A fragment can be valid HTML and still land somewhere unhelpful.</p>
<p class="note"><strong>What this setup does not claim:</strong> those browser checks are a separate smoke pass, not an end-to-end test suite currently run by GitHub Actions. The workflow runs check and build. It does not judge screenshots, verify every external reference or fact-check the prose.</p>
<h3>Is the published thing the thing I meant to publish?</h3>
<p>After deployment, I check the public URL as well. That catches the final gap between “the artifact was accepted” and “the page a reader gets has the expected images and links.” It is not an uptime-monitoring system; it is a last look at the actual result.</p>
</section>
<section id="tradeoffs"><h2>Boring does not mean free of trade-offs</h2>
<p>The price of this setup is a build step and a dependency graph. Changes are not live until they have been built and deployed. A publishing failure is still a failure, even if there is no application process to restart.</p>
<p>And the source repository is part of the publishing surface. Git history is not a bin for secrets or private photographs. For Gallery of Things, the copies prepared for publication have meaningful filenames and stripped metadata; the originals stay outside the repository. Hiding a caption would not make an uploaded image private.</p>
<p>What I get in return is a setup I can explain: ordinary content files, my own layout, a repeatable build and a static host. If I want to change the design, I change the templates. If I want to write, I should mostly be able to stay in the article.</p>
<p><a class="friend-link" href="https://www.linkedin.com/in/leszekwalerys/">Lechu</a>, <a class="friend-link" href="https://www.linkedin.com/in/marcinpetrow/">Maniek</a>, <a class="friend-link" href="https://www.linkedin.com/in/patryk-pospiech/">Patryk</a>: start with that. Keep the publishing pipeline small enough that you can describe it without opening a slide deck. Spend the rest of the time making something worth writing about.</p>
<p class="closing">The writing can be weird.<br>The publishing does not need to be.</p>
</section>
<section id="sources"><h2>Sources and the actual wiring</h2>
<p class="note">The implementation details above come from this site’s current configuration. The documentation below supports the platform behaviour; it does not imply that every feature described in those guides is enabled here.</p>
<ol class="sources">
<li><a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages">GitHub: What is GitHub Pages?</a> — static hosting and custom-domain support.</li>
<li><a href="https://docs.astro.build/en/basics/astro-components/">Astro: Components</a> — HTML output without a client-side component runtime by default.</li>
<li><a href="https://docs.astro.build/en/guides/content-collections/">Astro: Content Collections</a> and <a href="https://docs.astro.build/en/reference/routing-reference/#paginate">pagination reference</a> — structured content and generated archive pages.</li>
<li><a href="https://docs.astro.build/en/guides/images/">Astro: Images</a> — processing source images and preserving public assets as-is.</li>
<li><a href="https://docs.astro.build/en/reference/cli-reference/">Astro: CLI reference</a> — what dev, check, build and preview actually do.</li>
<li><a href="https://docs.astro.build/en/guides/deploy/github/">Astro: Deploy to GitHub Pages</a> — the Actions publishing source and domain setup.</li>
<li><a href="https://developers.cloudflare.com/fundamentals/api/">Cloudflare: API overview</a> and <a href="https://developers.cloudflare.com/dns/proxy-status/">DNS proxy status</a> — programmatic configuration and the distinction between DNS-only records and proxied HTTP traffic.</li>
<li><a href="https://github.com/lukaszciechanowicz/notes.ciechanowi.cz/blob/main/.github/workflows/deploy.yml">This site’s workflow</a>, <a href="https://github.com/lukaszciechanowicz/notes.ciechanowi.cz/blob/main/src/content.config.ts">content schema</a> and <a href="https://github.com/lukaszciechanowicz/notes.ciechanowi.cz/blob/main/astro.config.mjs">Astro configuration</a> — the small print behind this particular implementation.</li>
</ol>
</section>

<section id="rss-edit"><h2>EDIT: RSS, without another moving part</h2>
<p>Shortly after publishing this, I noticed the missing bit: there was no way to subscribe. A blog should not require remembering to visit it. So there is now <a href="/rss.xml">an RSS feed</a>.</p>
<p>I added Astro’s <a href="https://docs.astro.build/en/recipes/rss/">official <code>@astrojs/rss</code> helper</a> and a static endpoint at <code>src/pages/rss.xml.ts</code>. At build time, it reads the same posts collection as the homepage, sorts it in the same order, and generates <code>dist/rss.xml</code>. Each entry contains the title, publication date, description and an absolute link to the article. It includes all published posts, not just the ten that fit on the first archive page.</p>
<p>This is a summary feed, not a second rendering of the whole blog inside a reader. The full articles, sketches and photographs stay on the site. The article URL also serves as the entry’s stable identifier, so rebuilding the site does not turn the same post into a new item.</p>
<p>A <code>rel="alternate"</code> link in the shared page head lets feed-aware readers discover it. The tiny <em>rss</em> link at the bottom left is for humans. And because the XML is just another build artifact, the existing GitHub Actions workflow checks and publishes it alongside everything else. No extra server, scheduled job or manually maintained list of posts.</p>
<p>A small omission fixed with one endpoint. That is exactly the sort of boring I want from the publishing side of this thing.</p>
</section>
