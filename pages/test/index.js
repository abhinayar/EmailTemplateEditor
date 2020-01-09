import React from "react";
import ReactHtmlParser from "react-html-parser";

import ContentEditable from "react-contenteditable";

import { Resizable } from "re-resizable";

import uuidv4 from "uuid/v4";

import styles from "./styles.scss";

import replaceUrlParam from "../../services/helpers/replaceURLParams";

class Test extends React.Component {
  constructor() {
    super();
    this.contentEditable = React.createRef();
    this.state = {
      markup: "",
    };
  }

  updateMarkup = ev => {
    console.log("Markup updated: ", ev, ev.target || "NO TARGET");
    const { value = null } = (ev && ev.target) || {};
    console.log("markup val =>", value);
    if (value || value === "") {
      this.setState({ markup: value }, () => {
        // Update Images
        this.aggregateImages();
        // Update BG Images
        this.aggregateBackgroundImages();
        // Update Links
        this.aggregateLinks();
      });
    }
  };

  handleHTMLChange = evt => {
    this.setState({ markup: evt.target.value }, () => {
      // Update Images
      this.aggregateImages();
      // Update BG Images
      this.aggregateBackgroundImages();
      // Update Links
      this.aggregateLinks();
    });
  };

  aggregateImages = () => {
    // Empty the dynamic container
    $("#dynamicImages").empty();

    $("#emailWrapper img").each((index, element) => {
      const src = $(element).attr("src");
      const style = $(element).attr("style");
      const markup = $(element);

      // Add elements for the first time
      let uid = "";
      if (!$(element).attr("dynaId")) {
        uid = uuidv4();
      }
      // Re-add elements without replacing the id.
      else {
        uid = $(element).attr("dynaId");
      }

      $(element).attr("dynaId", uid);
      const html = `
          <div class="dynaImage">
            <input
              id="input-${uid}"
              type="text"
              placeholder="Replace image URL"
              value="${src}"
            />
            <br />
            <br />
            <img
              src="${src}"
              dynaId="${uid}"
              style="${style}"
            />
          </div>
        `;
      $("#dynamicImages").append(html);

      $(`#input-${uid}`).on("change", null, ev => {
        // alert(ev.target.value);
        $(`*[dynaId="${uid}"]`).attr("src", ev && ev.target && ev.target.value);

        // Update the textarea
        $("#markup").val($("#emailWrapper div[contenteditable='true']").html());
      });
    });
  };

  aggregateBackgroundImages = () => {
    $("#dynamicBGImages").empty();

    $("#emailWrapper *").each((index, element) => {
      const backgroundAttr = $(element).attr("background");
      const elementStyle = $(element).attr("style");

      let finalBgURL = "";

      if (backgroundAttr) {
        finalBgURL = backgroundAttr;
      } else if (elementStyle) {
        if (elementStyle.indexOf("url(") !== -1) {
          // console.log(elementStyle);

          const bgStyleStartIndex = elementStyle.indexOf("url(");
          // console.log("start index =>", bgStyleStartIndex);

          const bgStyleString = elementStyle.substring(
            bgStyleStartIndex,
            elementStyle.length
          );
          // console.log("style string: ", bgStyleString);

          const bgURLStartIndex = bgStyleString.indexOf("(");
          const bgURLEndIndex = bgStyleString.indexOf(")");

          const bgURLOnly = bgStyleString.substring(
            bgURLStartIndex + 1,
            bgURLEndIndex
          );

          finalBgURL = bgURLOnly;
          // console.log(finalBgURL);
        }
      }

      if (finalBgURL) {
        const uid = uuidv4();
        const html = `
            <div class="dynaBgImage">
              <input
                id="input-${uid}"
                type="text"
                placeholder="Replace background image URL"
                value="${finalBgURL}"
              />
              <br />
              <br />
              <img
                src="${finalBgURL}"
                dynaId="${uid}"
              />
            </div>
          `;
        $("#dynamicBGImages").append(html);

        $(`#input-${uid}`).on("change", null, ev => {
          alert(`changed bg image url => ${finalBgURL}, ${ev.target.value}`);

          // Construct replace regex
          const regex = new RegExp(finalBgURL, "g");

          // Replace all occurences of that bg image
          $("#markup").val(
            $("#markup")
              .val()
              .replace(regex, ev && ev.target && ev.target.value)
          );

          // Update the preview
          const markupVal = $("#markup").val();
          this.setState(
            {
              markup: markupVal,
            },
            () => {
              alert("Updated bg image markup state");
            }
          );

          // Update all background images
          this.aggregateBackgroundImages();
        });
      }
    });
  };

  aggregateLinks = () => {
    $("#dynamicLinks").empty();

    $("#emailWrapper a").each((index, element) => {
      const href = $(element).attr("href");
      const outer = $(element).html();

      let uid = "";
      if (!$(element).attr("dynaId")) {
        uid = uuidv4();
      } else {
        uid = $(element).attr("dynaId");
      }

      $(element).attr("dynaId", uid);
      const html = `
        <div class="dynaLink">
          <input
            id="input-link-${uid}"
            type="text"
            placeholder="Replace link URL"
            value="${href}"
          />
          ${
            $(element)
              .parent()
              .html()
              .toString()
              .indexOf("img") === -1
              ? `<br />
            <input
              id="input-text-${uid}"
              type="text"
              placeholder="Replace link text"
              value="${$(element).text()}"
            />`
              : `<p>Replace the image in the Images toggle.</p>`
          }
          <p dynaId="${uid}">${outer}</p>
        </div>
      `;
      $("#dynamicLinks").append(html);

      // Handle link href updates
      $(`#input-link-${uid}`).on("change", null, ev => {
        // alert(ev.target.value);
        $(`*[dynaId="${uid}"]`).attr(
          "href",
          ev && ev.target && ev.target.value
        );
        this.updateLinksWithUTMs();

        // Update the textarea
        $("#markup").val($("#emailWrapper div[contenteditable='true']").html());
      });

      // Handle link text updates
      $(`#input-text-${uid}`).on("change", null, ev => {
        // alert(ev.target.value);
        $(`*[dynaId="${uid}"]`).html(ev && ev.target && ev.target.value);

        // Update the textarea
        $("#markup").val($("#emailWrapper div[contenteditable='true']").html());
      });
    });
  };

  updateLinksWithUTMs = () => {
    const utm_medium = $("#utm_medium").val();
    const utm_source = $("#utm_source").val();
    const utm_campaign = $("#utm_campaign").val();
    const utm_content = $("#utm_content").val();
    const utm_term = $("#utm_term").val();

    // Update all URLs
    $("#emailWrapper div[contenteditable='true'] a").each((index, element) => {
      let href = $(element).attr("href");
      if (href.indexOf("mailto") === -1) {
        href = replaceUrlParam(href, "utm_medium", utm_medium);
        href = replaceUrlParam(href, "utm_source", utm_source);
        href = replaceUrlParam(href, "utm_campaign", utm_campaign);
        href = replaceUrlParam(href, "utm_content", utm_content);
        href = replaceUrlParam(href, "utm_term", utm_term);

        $(element).attr("href", href);
      }
    });
  };

  render() {
    return (
      <div id="wrapper">
        <div id="inputWrapper">
          <div className="inputInner">
            <div className="inputGroup">
              <textarea
                name="markup"
                id="markup"
                cols="30"
                rows="10"
                onChange={this.updateMarkup}
                value={this.state.markup || ""}
                placeholder="Enter Email HTML Markup"
              >
              </textarea>
            </div>
            <div className="inputGroup">
              <details>
                <summary>UTM Parameters</summary>
                <UTMParams></UTMParams>
              </details>
            </div>
            <div className="inputGroup">
              <details>
                <summary>Images</summary>
                <div id="dynamicImages"></div>
              </details>
            </div>
            <div className="inputGroup">
              <details>
                <summary>Background Images</summary>
                <div id="dynamicBGImages"></div>
              </details>
            </div>
            <div className="inputGroup">
              <details>
                <summary>Links</summary>
                <div id="dynamicLinks"></div>
              </details>
            </div>
          </div>
        </div>
        <div id="emailWrapper">
          <ContentEditable
            innerRef={this.contentEditable}
            html={this.state.markup} // innerHTML of the editable div
            disabled={false} // use true to disable editing
            onChange={this.handleHTMLChange} // handle innerHTML change
            tagName="div" // Use a custom HTML tag (uses a div by default)
          />
        </div>
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* === Styles === */}
        <style jsx global>
          {styles}
        </style>
        <link
          rel="stylesheet"
          href="https://highlightjs.org/static/demo/styles/railscasts.css"
        />
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* === jQuery === */}
        <script
          src="https://code.jquery.com/jquery-3.4.1.min.js"
          integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo="
          crossOrigin="anonymous"
        />
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* === jQuery UI === */}
        <link
          rel="stylesheet"
          href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css"
        />
        <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js" />
      </div>
    );
  }
}

export default Test;

class UTMParams extends React.Component {
  state = {
    utm_source: "tmpemail",
    utm_medium: "email",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    utm_parameters: "No Params. Yet.",
  };

  updateLinksWithUTMs = () => {
    const {
      utm_medium = "email",
      utm_source = "tmpemail",
      utm_campaign = "none",
      utm_content = "none",
      utm_term = "none",
    } = this.state;

    // Construct the utm params
    const params = `utm_source=${utm_source}&utm_medium=${utm_medium}&utm_campaign=${utm_campaign}&utm_term=${utm_term}&utm_content=${utm_content}`;
    this.setState({ utm_parameters: params });
    // Update all URLs
    $("#emailWrapper div[contenteditable='true'] a").each((index, element) => {
      let href = $(element).attr("href");
      if (href.indexOf("mailto") === -1) {
        href = replaceUrlParam(href, "utm_medium", utm_medium);
        href = replaceUrlParam(href, "utm_source", utm_source);
        href = replaceUrlParam(href, "utm_campaign", utm_campaign);
        href = replaceUrlParam(href, "utm_content", utm_content);
        href = replaceUrlParam(href, "utm_term", utm_term);

        $(element).attr("href", href);
      }
    });

    // Update the textarea
    $("#markup").val($("#emailWrapper div[contenteditable='true']").html());
  };

  render() {
    return (
      <div>
        <p style={{ width: "100%", paddingRight: "32px" }}>
          Final UTMs:
          <pre style={{ color: "#555", width: "100%" }}>
            {this.state.utm_parameters}
          </pre>
        </p>
        <div className="inputGroup">
          <label htmlFor="utm_source">UTM Source</label>
          <input
            type="text"
            id="utm_source"
            placeholder="UTM Source"
            value={this.state.utm_source}
            onChange={ev => {
              this.setState(
                {
                  utm_source: ev && ev.target && ev.target.value,
                },
                () => {
                  this.updateLinksWithUTMs();
                }
              );
            }}
          />
        </div>
        <div className="inputGroup">
          <label htmlFor="utm_medium">UTM Medium</label>
          <input
            type="text"
            id="utm_medium"
            placeholder="UTM Medium"
            value={this.state.utm_medium}
            onChange={ev => {
              this.setState(
                {
                  utm_medium: ev && ev.target && ev.target.value,
                },
                () => {
                  this.updateLinksWithUTMs();
                }
              );
            }}
          />
        </div>
        <div className="inputGroup">
          <label htmlFor="utm_medium">UTM Campaign</label>
          <input
            type="text"
            id="utm_campaign"
            placeholder="UTM Campaign"
            value={this.state.utm_campaign}
            onChange={ev => {
              this.setState(
                {
                  utm_campaign: ev && ev.target && ev.target.value,
                },
                () => {
                  this.updateLinksWithUTMs();
                }
              );
            }}
          />
        </div>
        <div className="inputGroup">
          <label htmlFor="utm_content">UTM Content</label>
          <input
            type="text"
            id="utm_content"
            placeholder="UTM Content"
            value={this.state.utm_content}
            onChange={ev => {
              this.setState(
                {
                  utm_content: ev && ev.target && ev.target.value,
                },
                () => {
                  this.updateLinksWithUTMs();
                }
              );
            }}
          />
        </div>
        <div className="inputGroup">
          <label htmlFor="utm_content">UTM Term</label>
          <input
            type="text"
            id="utm_term"
            placeholder="UTM Term"
            value={this.state.utm_term}
            onChange={ev => {
              this.setState(
                {
                  utm_term: ev && ev.target && ev.target.value,
                },
                () => {
                  this.updateLinksWithUTMs();
                }
              );
            }}
          />
        </div>
      </div>
    );
  }
}
