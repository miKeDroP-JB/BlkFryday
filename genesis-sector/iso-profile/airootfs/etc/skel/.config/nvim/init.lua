-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  VYRA: GENESIS SECTOR - NEOVIM ULTRA MODE                           ║
-- ║  The Ultimate Code Manifestation Interface                           ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- === BOOTSTRAP LAZY.NVIM ===
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git", "clone", "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- === LEADER KEY ===
vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- === CORE OPTIONS ===
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.mouse = "a"
vim.opt.showmode = false
vim.opt.clipboard = "unnamedplus"
vim.opt.breakindent = true
vim.opt.undofile = true
vim.opt.ignorecase = true
vim.opt.smartcase = true
vim.opt.signcolumn = "yes"
vim.opt.updatetime = 250
vim.opt.timeoutlen = 300
vim.opt.splitright = true
vim.opt.splitbelow = true
vim.opt.list = true
vim.opt.listchars = { tab = "» ", trail = "·", nbsp = "␣" }
vim.opt.inccommand = "split"
vim.opt.cursorline = true
vim.opt.scrolloff = 10
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true
vim.opt.termguicolors = true
vim.opt.pumheight = 10
vim.opt.showtabline = 2
vim.opt.laststatus = 3

-- === PLUGINS ===
require("lazy").setup({
  -- Color Scheme (Neon Ritual)
  {
    "folke/tokyonight.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("tokyonight").setup({
        style = "night",
        transparent = true,
        terminal_colors = true,
        styles = {
          comments = { italic = true },
          keywords = { italic = true },
          functions = { bold = true },
          sidebars = "transparent",
          floats = "transparent",
        },
      })
      vim.cmd.colorscheme("tokyonight-night")
    end,
  },

  -- File Explorer
  {
    "nvim-neo-tree/neo-tree.nvim",
    branch = "v3.x",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-tree/nvim-web-devicons",
      "MunifTanjim/nui.nvim",
    },
    config = function()
      require("neo-tree").setup({
        close_if_last_window = true,
        window = { width = 35 },
        filesystem = {
          follow_current_file = { enabled = true },
          use_libuv_file_watcher = true,
        },
      })
    end,
  },

  -- Fuzzy Finder
  {
    "nvim-telescope/telescope.nvim",
    branch = "0.1.x",
    dependencies = {
      "nvim-lua/plenary.nvim",
      { "nvim-telescope/telescope-fzf-native.nvim", build = "make" },
    },
    config = function()
      require("telescope").setup({
        defaults = {
          borderchars = { "─", "│", "─", "│", "╭", "╮", "╯", "╰" },
        },
      })
      require("telescope").load_extension("fzf")
    end,
  },

  -- LSP Configuration
  {
    "neovim/nvim-lspconfig",
    dependencies = {
      "williamboman/mason.nvim",
      "williamboman/mason-lspconfig.nvim",
      "folke/neodev.nvim",
    },
    config = function()
      require("mason").setup()
      require("mason-lspconfig").setup({
        ensure_installed = {
          "lua_ls", "pyright", "ts_ls", "rust_analyzer",
          "gopls", "clangd", "bashls", "jsonls", "yamlls",
        },
      })
      require("neodev").setup()

      local lspconfig = require("lspconfig")
      local servers = { "lua_ls", "pyright", "ts_ls", "rust_analyzer", "gopls" }
      for _, lsp in ipairs(servers) do
        lspconfig[lsp].setup({})
      end
    end,
  },

  -- Autocompletion
  {
    "hrsh7th/nvim-cmp",
    dependencies = {
      "hrsh7th/cmp-nvim-lsp",
      "hrsh7th/cmp-buffer",
      "hrsh7th/cmp-path",
      "L3MON4D3/LuaSnip",
      "saadparwaiz1/cmp_luasnip",
    },
    config = function()
      local cmp = require("cmp")
      local luasnip = require("luasnip")

      cmp.setup({
        snippet = {
          expand = function(args) luasnip.lsp_expand(args.body) end,
        },
        mapping = cmp.mapping.preset.insert({
          ["<C-n>"] = cmp.mapping.select_next_item(),
          ["<C-p>"] = cmp.mapping.select_prev_item(),
          ["<C-Space>"] = cmp.mapping.complete(),
          ["<CR>"] = cmp.mapping.confirm({ select = true }),
        }),
        sources = {
          { name = "nvim_lsp" },
          { name = "luasnip" },
          { name = "buffer" },
          { name = "path" },
        },
      })
    end,
  },

  -- Treesitter
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter.configs").setup({
        ensure_installed = {
          "lua", "python", "javascript", "typescript", "tsx",
          "rust", "go", "c", "cpp", "bash", "json", "yaml",
          "html", "css", "markdown", "markdown_inline",
        },
        highlight = { enable = true },
        indent = { enable = true },
      })
    end,
  },

  -- Status Line
  {
    "nvim-lualine/lualine.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    config = function()
      require("lualine").setup({
        options = {
          theme = "tokyonight",
          component_separators = { left = "", right = "" },
          section_separators = { left = "", right = "" },
        },
        sections = {
          lualine_a = { "mode" },
          lualine_b = { "branch", "diff", "diagnostics" },
          lualine_c = { "filename" },
          lualine_x = { "encoding", "fileformat", "filetype" },
          lualine_y = { "progress" },
          lualine_z = { "location" },
        },
      })
    end,
  },

  -- Git Integration
  { "lewis6991/gitsigns.nvim", config = true },
  { "tpope/vim-fugitive" },

  -- Autopairs
  { "windwp/nvim-autopairs", config = true },

  -- Comments
  { "numToStr/Comment.nvim", config = true },

  -- Which Key
  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    config = true,
  },

  -- Buffer Line
  {
    "akinsho/bufferline.nvim",
    version = "*",
    dependencies = "nvim-tree/nvim-web-devicons",
    config = function()
      require("bufferline").setup({
        options = {
          mode = "buffers",
          separator_style = "slant",
          diagnostics = "nvim_lsp",
        },
      })
    end,
  },

  -- Terminal
  {
    "akinsho/toggleterm.nvim",
    version = "*",
    config = function()
      require("toggleterm").setup({
        size = 20,
        open_mapping = [[<c-\>]],
        direction = "float",
        float_opts = {
          border = "curved",
        },
      })
    end,
  },

  -- AI Integration
  {
    "github/copilot.vim",
    event = "InsertEnter",
  },

  -- Dashboard
  {
    "goolord/alpha-nvim",
    config = function()
      local alpha = require("alpha")
      local dashboard = require("alpha.themes.dashboard")

      dashboard.section.header.val = {
        [[                                                    ]],
        [[  ██╗   ██╗██╗   ██╗██████╗  █████╗                 ]],
        [[  ██║   ██║╚██╗ ██╔╝██╔══██╗██╔══██╗                ]],
        [[  ██║   ██║ ╚████╔╝ ██████╔╝███████║                ]],
        [[  ╚██╗ ██╔╝  ╚██╔╝  ██╔══██╗██╔══██║                ]],
        [[   ╚████╔╝    ██║   ██║  ██║██║  ██║                ]],
        [[    ╚═══╝     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝                ]],
        [[                                                    ]],
        [[  ═══════════════════════════════════════════════   ]],
        [[        G E N E S I S   S E C T O R                 ]],
        [[      Portable AI Development Universe              ]],
        [[  ═══════════════════════════════════════════════   ]],
      }

      dashboard.section.buttons.val = {
        dashboard.button("f", "  Find file", ":Telescope find_files <CR>"),
        dashboard.button("n", "  New file", ":ene <BAR> startinsert <CR>"),
        dashboard.button("r", "  Recent files", ":Telescope oldfiles <CR>"),
        dashboard.button("g", "  Find text", ":Telescope live_grep <CR>"),
        dashboard.button("c", "  Configuration", ":e ~/.config/nvim/init.lua <CR>"),
        dashboard.button("s", "  Swarm Panel", ":!swarm-panel<CR>"),
        dashboard.button("v", "⟡  VYRA Channel 0", ":!vyra channel 0<CR>"),
        dashboard.button("q", "  Quit", ":qa<CR>"),
      }

      alpha.setup(dashboard.config)
    end,
  },
})

-- === KEYMAPS ===
local keymap = vim.keymap.set

-- File Explorer
keymap("n", "<leader>e", ":Neotree toggle<CR>", { desc = "Toggle Explorer" })

-- Telescope
keymap("n", "<leader>ff", ":Telescope find_files<CR>", { desc = "Find Files" })
keymap("n", "<leader>fg", ":Telescope live_grep<CR>", { desc = "Live Grep" })
keymap("n", "<leader>fb", ":Telescope buffers<CR>", { desc = "Buffers" })
keymap("n", "<leader>fh", ":Telescope help_tags<CR>", { desc = "Help" })

-- Buffer navigation
keymap("n", "<S-h>", ":bprevious<CR>", { desc = "Prev Buffer" })
keymap("n", "<S-l>", ":bnext<CR>", { desc = "Next Buffer" })
keymap("n", "<leader>bd", ":bdelete<CR>", { desc = "Delete Buffer" })

-- Window navigation
keymap("n", "<C-h>", "<C-w>h", { desc = "Move to left window" })
keymap("n", "<C-j>", "<C-w>j", { desc = "Move to bottom window" })
keymap("n", "<C-k>", "<C-w>k", { desc = "Move to top window" })
keymap("n", "<C-l>", "<C-w>l", { desc = "Move to right window" })

-- LSP
keymap("n", "gd", vim.lsp.buf.definition, { desc = "Go to Definition" })
keymap("n", "gr", vim.lsp.buf.references, { desc = "Go to References" })
keymap("n", "K", vim.lsp.buf.hover, { desc = "Hover Documentation" })
keymap("n", "<leader>ca", vim.lsp.buf.code_action, { desc = "Code Action" })
keymap("n", "<leader>rn", vim.lsp.buf.rename, { desc = "Rename" })

-- Git
keymap("n", "<leader>gg", ":Git<CR>", { desc = "Git Status" })
keymap("n", "<leader>gc", ":Git commit<CR>", { desc = "Git Commit" })
keymap("n", "<leader>gp", ":Git push<CR>", { desc = "Git Push" })

-- VYRA Commands
keymap("n", "<leader>vs", ":!vyra swarm status<CR>", { desc = "Swarm Status" })
keymap("n", "<leader>va", ":!vyra agent list<CR>", { desc = "Agent List" })
keymap("n", "<leader>v0", ":!vyra channel 0<CR>", { desc = "Channel 0" })

-- Clear search highlight
keymap("n", "<Esc>", ":nohlsearch<CR>", { desc = "Clear Search" })
