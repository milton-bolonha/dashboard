/**
 * 🎨 Interactive Helpers - Utilitários para CLI interativa
 * Baseado nos padrões de interface do usuário
 */

import chalk from "chalk";
import logSymbols from "log-symbols";
import fs from "fs";
import path from "path";

/**
 * * 🎨 Formatador de mensagens com estilo
 */
const messageFormatter = (options) => {
  if (!options) {
    return `${chalk.red(" " + logSymbols.error + " : ")} ${chalk.red(
      "!Error FATAL, cadê pô"
    )}`;
  }

  const defaultOptions = {
    agent: null,
    subAgent: null,
    msg: null,
    style: {
      color: "#fff",
      bold: false,
      underline: false,
      inverse: false,
      bgColor: "#000",
    },
    browserExtension: false,
    clear: false,
    version: "",
  };

  const opts = { ...defaultOptions, ...options };
  const { agent, subAgent, msg, style, browserExtension, clear, version } =
    opts;
  const { color, bold, underline, inverse } = style;
  let styledMsg = chalk.white;

  if (agent === "message" || agent === "chapter" || agent === "characters") {
    styledMsg = chalk.hex(color);
    if (browserExtension) {
      styledMsg = "color: " + color;
    }
    if (bold) {
      if (!browserExtension) {
        styledMsg = styledMsg.bold;
      } else {
        styledMsg = styledMsg + "; font-weight: bold";
      }
    }
    if (underline) {
      if (!browserExtension) {
        styledMsg = styledMsg.underline;
      } else {
        styledMsg = styledMsg + "; text-decoration: underline";
      }
    }
    if (inverse) {
      if (!browserExtension) {
        styledMsg = styledMsg.inverse;
      } else {
        styledMsg =
          "background-color: " +
          color +
          "; color: white; mix-blend-mode: difference;";
      }
    }
    let moreOptions = null;
    if (clear || subAgent === "character") {
      moreOptions = { clear: clear, subAgent: subAgent };
    }
    if (agent === "chapter") {
      return { styledMsg, msg, subAgent, moreOptions };
    }
    return { styledMsg, msg, moreOptions };
  }

  if (subAgent === "error") {
    return `${chalk.red(" " + logSymbols.error + " : ")} ${chalk.red(
      "!Error"
    )}`;
  }
  if (subAgent === "warning") {
    return `${chalk.yellow(" " + logSymbols.warning + " : ")} ${chalk.yellow(
      "Warning"
    )}`;
  }
  if (subAgent === "info") {
    return `${chalk.blue(" " + logSymbols.info + " : ")} ${chalk.blue("Info")}`;
  }
  if (subAgent === "success") {
    return `${chalk.green(" " + logSymbols.success + " : ")} ${chalk.green(
      "Success!!!"
    )}`;
  }
};

/**
 * 🎯 Menu Builder - Construtor de menus baseado em configuração
 */
class MenuBuilder {
  constructor(term) {
    this.term = term;
  }

  /**
   * 📋 Cria menu simples com opções
   */
  createSingleColumnMenu(items, callback, options = {}) {
    const defaultOptions = {
      y: 2,
      style: this.term.inverse,
      selectedStyle: this.term.dim.blue.bgGreen,
      ...options,
    };

    return this.term.singleColumnMenu(items, defaultOptions, callback);
  }

  /**
   * 🔢 Cria menu em grid
   */
  createGridMenu(items, callback, options = {}) {
    const defaultOptions = {
      style: this.term.inverse,
      selectedStyle: this.term.dim.blue.bgGreen,
      ...options,
    };

    return this.term.gridMenu(items, defaultOptions, callback);
  }

  /**
   * ➡️ Cria menu horizontal
   */
  createSingleLineMenu(items, callback, options = {}) {
    const defaultOptions = {
      y: 1,
      style: this.term.inverse,
      selectedStyle: this.term.dim.blue.bgGreen,
      ...options,
    };

    return this.term.singleLineMenu(items, defaultOptions, callback);
  }
}

/**
 * 📊 Progress Indicators - Indicadores de progresso visuais
 */
class ProgressIndicator {
  constructor(term) {
    this.term = term;
  }

  /**
   * ⏳ Spinner simples
   */
  createSpinner(message) {
    const spinnerChars = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];
    let i = 0;

    this.term.white(`⏳ ${message}`);

    const animation = setInterval(() => {
      this.term.left(1);
      this.term.write(spinnerChars[i % spinnerChars.length]);
      i++;
    }, 100);

    return {
      stop: () => {
        clearInterval(animation);
        this.term.left(1);
        this.term.green("✓\n");
      },
      error: () => {
        clearInterval(animation);
        this.term.left(1);
        this.term.red("✗\n");
      },
    };
  }

  /**
   * 📊 Barra de progresso
   */
  createProgressBar(title = "", options = {}) {
    return this.term.progressBar({
      width: 40,
      title,
      eta: true,
      percent: true,
      ...options,
    });
  }
}

/**
 * 🎨 Screen Effects - Efeitos visuais para telas
 */
class ScreenEffects {
  constructor(term) {
    this.term = term;
  }

  /**
   * 🌈 Cor aleatória do cursor
   */
  randomCursorColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    this.term.setCursorColorRgb(r, g, b);
  }

  /**
   * 📺 Animação de frames
   */
  createFrameAnimation(frames, interval = 200) {
    let i = 0;

    const animation = setInterval(() => {
      const frame = frames[i % frames.length];
      // Implementar lógica de frame aqui
      i++;
    }, interval);

    return {
      stop: () => clearInterval(animation),
    };
  }

  /**
   * 🎪 Efeito de typing
   */
  async typewriterEffect(text, speed = 50) {
    for (let i = 0; i < text.length; i++) {
      this.term.write(text[i]);
      await new Promise((resolve) => setTimeout(resolve, speed));
    }
  }
}

/**
 * 🗂️ Data Scanner - Scanner de dados para menus dinâmicos
 */
class DataScanner {
  /**
   * 📁 Escaneia diretório e retorna dados formatados
   */
  static scanDirectory(directory, method = "arrayTitles") {
    try {
      const files = fs.readdirSync(directory);
      let arrayItems = [];
      let arrayTitles = [];

      files.forEach((file) => {
        try {
          const filePath = path.join(directory, file);
          const stats = fs.statSync(filePath);

          if (stats.isFile() && file.endsWith(".json")) {
            const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

            if (method === "arrayTitles") {
              arrayTitles.push(content.title || content.name || file);
            }
            if (method === "arrayItems") {
              arrayItems.push({ file, content });
            }
          }
        } catch (error) {
          // Ignorar arquivos que não podem ser lidos
        }
      });

      return method === "arrayTitles" ? arrayTitles : arrayItems;
    } catch (error) {
      return [];
    }
  }

  /**
   * 🔍 Encontra item por título
   */
  static findItemByTitle(items, title) {
    return items.find(
      (item) =>
        item.content.title === title ||
        item.content.name === title ||
        item.file === title
    );
  }
}

/**
 * ⌨️ Input Handlers - Manipuladores de entrada
 */
class InputHandlers {
  constructor(term) {
    this.term = term;
  }

  /**
   * 📝 Input field configurável
   */
  async createInputField(prompt, options = {}) {
    this.term.green(prompt);
    const result = await this.term.inputField(options);
    this.term.write("\n");
    return result;
  }

  /**
   * ✅ Confirmação sim/não
   */
  async createConfirmation(message) {
    this.term.cyan(message);
    const options = ["✅ Sim", "❌ Não"];

    return new Promise((resolve) => {
      this.term.singleColumnMenu(options, (error, response) => {
        resolve(response.selectedIndex === 0);
      });
    });
  }

  /**
   * 📋 Seleção múltipla
   */
  async createMultiSelect(items, message = "Selecione os itens:") {
    this.term.cyan(message + "\n\n");
    // Implementar seleção múltipla
    // Por enquanto, usar seleção simples
    return new Promise((resolve) => {
      this.term.singleColumnMenu(items, (error, response) => {
        resolve([response.selectedText]);
      });
    });
  }
}

/**
 * 🎭 Theme Manager - Gerenciador de temas
 */
class ThemeManager {
  static themes = {
    default: {
      primary: "#00ff00",
      secondary: "#0066ff",
      success: "#00ff00",
      warning: "#ffff00",
      error: "#ff0000",
      info: "#00ffff",
    },
    dark: {
      primary: "#bb86fc",
      secondary: "#03dac6",
      success: "#4caf50",
      warning: "#ff9800",
      error: "#f44336",
      info: "#2196f3",
    },
    matrix: {
      primary: "#00ff00",
      secondary: "#008800",
      success: "#00ff00",
      warning: "#88ff00",
      error: "#ff0000",
      info: "#00ff88",
    },
  };

  static applyTheme(term, themeName = "default") {
    const theme = this.themes[themeName] || this.themes.default;

    // Aplicar tema no terminal
    term.styleReset();

    return {
      primary: (text) => term.hex(theme.primary)(text),
      secondary: (text) => term.hex(theme.secondary)(text),
      success: (text) => term.hex(theme.success)(text),
      warning: (text) => term.hex(theme.warning)(text),
      error: (text) => term.hex(theme.error)(text),
      info: (text) => term.hex(theme.info)(text),
    };
  }
}

/**
 * 📱 Layout Manager - Gerenciador de layouts
 */
class LayoutManager {
  constructor(term) {
    this.term = term;
  }

  /**
   * 📦 Cria layout em boxes
   */
  createBoxLayout(title, content, width = 60) {
    const border = "═".repeat(width - 2);

    this.term.cyan(`╔${border}╗\n`);
    this.term.cyan(`║${title.padEnd(width - 2)}║\n`);
    this.term.cyan(`╠${border}╣\n`);

    content.split("\n").forEach((line) => {
      this.term.cyan(`║`);
      this.term.white(line.padEnd(width - 2));
      this.term.cyan(`║\n`);
    });

    this.term.cyan(`╚${border}╝\n`);
  }

  /**
   * 📋 Cria layout de lista
   */
  createListLayout(title, items) {
    this.term.bold.cyan(`\n${title}\n`);
    this.term.cyan("─".repeat(title.length) + "\n");

    items.forEach((item, index) => {
      this.term.gray(`${index + 1}. `);
      this.term.white(`${item}\n`);
    });
  }

  /**
   * 🔢 Cria layout de estatísticas
   */
  createStatsLayout(stats) {
    this.term.bold.cyan("\n📊 Estatísticas\n");
    this.term.cyan("─".repeat(15) + "\n");

    Object.entries(stats).forEach(([key, value]) => {
      this.term.white(`${key}: `);
      this.term.green(`${value}\n`);
    });
  }
}

export {
  messageFormatter,
  MenuBuilder,
  ProgressIndicator,
  ScreenEffects,
  DataScanner,
  InputHandlers,
  ThemeManager,
  LayoutManager,
};
