---
title: Lattice Link Map
---
[About](#site/about 'Parent')
---
Visual representation of the theological lattice structure. These diagrams show how doctrines interconnect rather than standing in isolated hierarchies.

**Key insight:** 89.7% of links stay within categories (topic coherence), while 10.3% create cross-category connections (the lattice web).

---
# Cross-Category Summary

This high-level view shows how the major theological domains connect to each other.

```mermaid
graph TD
    %% Systematic Theology Cross-Category Link Map

    baptism[BAPTISM]
    bible[BIBLE]
    church[CHURCH]
    freewill[FREEWILL]
    god[GOD]
    jesus[JESUS]
    man[MAN]
    salvation[SALVATION]
    spirit[SPIRIT]

    freewill ==>|9| salvation
    baptism ==>|8| salvation
    god -->|4| jesus
    jesus -->|4| god
    baptism -->|4| church
    salvation -->|3| jesus
    salvation -->|3| man
    freewill -->|3| man
    god -->|2| spirit
    baptism -->|2| god
    freewill -->|2| god
    freewill -->|2| jesus
    jesus -->|1| bible
    jesus -->|1| man
    jesus -->|1| spirit
```

## Analysis

**Total links:** 525
- **Within-category:** 471 (89.7%) - Maintaining topic coherence
- **Cross-category:** 54 (10.3%) - Creating the lattice web

**Top Cross-Category Connections:**

1. **freewill → salvation** (9 links) - Election/predestination theology is core to soteriology
2. **baptism → salvation** (8 links) - Baptismal theology directly impacts salvation doctrine
3. **god ↔ jesus** (4 each way) - Christology and theology proper are deeply intertwined
4. **baptism → church** (4 links) - Ecclesiology and sacramental theology connect
5. **salvation → jesus** (3 links) - Christology grounds soteriology
6. **salvation → man** (3 links) - Anthropology and soteriology intersect
7. **freewill → man** (3 links) - Human agency and anthropology

**Observations:**
- **bible** folder has ZERO outbound cross-category links (purely bibliology-focused)
- **church** folder has minimal cross-category links (only 2 total)
- **freewill** has the most cross-category connections (16 total)


# Detailed Connection Map

This detailed view shows specific cross-category file connections grouped by theological domain.

```mermaid
graph LR
    %% Detailed Cross-Category Link Map

    subgraph BAPTISM
        bap_necessity["Necessity"]
        bap_sacrament["Sacrament"]
        bap_subjects["Subjects"]
        bap_mode["Mode"]
        bap_mikveh["Mikveh"]
    end

    subgraph CHURCH
        chu_church["Church"]
        chu_ordinances["Ordinances"]
    end

    subgraph FREEWILL
        fw_election["Election"]
        fw_predestination["Predestination"]
        fw_sovereignty["Sovereignty"]
        fw_responsibility["Responsibility"]
        fw_foreknowledge["Foreknowledge"]
    end

    subgraph GOD
        god_god["God"]
        god_reconciliation["Reconciliation"]
        god_trinity["Trinity"]
        god_sovereignty["Sovereignty"]
    end

    subgraph JESUS
        jes_jesus["Jesus"]
        jes_incarnation["Incarnation"]
        jes_atonement["Atonement"]
        jes_resurrection["Resurrection"]
        jes_messiah["Messiah"]
    end

    subgraph MAN
        man_man["Man"]
        man_fall["Fall"]
        man_free_will["Free Will"]
    end

    subgraph SALVATION
        sal_salvation["Salvation"]
        sal_covenant["Covenant"]
        sal_justification["Justification"]
        sal_grace["Grace"]
        sal_perseverance["Perseverance"]
        sal_glorification["Glorification"]
        sal_faith["Faith"]
        sal_sanctification["Sanctification"]
    end

    subgraph SPIRIT
        spi_spirit["Spirit"]
    end

    %% Freewill → Salvation (9 links)
    fw_election ==> sal_grace
    fw_election ==> sal_perseverance
    fw_predestination ==> sal_grace
    fw_sovereignty ==> sal_grace
    fw_sovereignty ==> sal_justification
    fw_foreknowledge ==> sal_faith
    fw_responsibility --> sal_sanctification

    %% Baptism → Salvation (8 links)
    bap_necessity ==> sal_grace
    bap_necessity ==> sal_faith
    bap_sacrament ==> sal_grace
    bap_sacrament --> sal_faith
    bap_subjects --> sal_covenant
    bap_mikveh --> sal_covenant

    %% God ↔ Jesus (4 each)
    god_god --> jes_incarnation
    god_reconciliation --> jes_incarnation
    god_trinity --> jes_jesus
    jes_jesus --> god_god
    jes_incarnation --> god_trinity

    %% Baptism → Church (4 links)
    bap_necessity --> chu_ordinances
    bap_sacrament --> chu_ordinances
    bap_subjects --> chu_church
    bap_mode --> chu_church

    %% Salvation → Jesus (3 links)
    sal_covenant --> jes_messiah
    sal_salvation --> jes_atonement
    sal_glorification --> jes_resurrection

    %% Salvation → Man (3 links)
    sal_salvation --> man_fall
    sal_justification --> man_fall
    sal_glorification --> man_fall

    %% Freewill → Man (3 links)
    fw_election --> man_fall
    fw_responsibility --> man_free_will
    fw_sovereignty --> man_fall

    %% God → Spirit (2 links)
    god_trinity --> spi_spirit
    god_sovereignty --> spi_spirit

    %% Other connections
    bap_necessity --> god_sovereignty
    bap_sacrament --> god_trinity
    fw_election --> god_sovereignty
    fw_election --> jes_atonement
    fw_predestination --> jes_atonement
    sal_grace --> jes_atonement
    sal_faith --> jes_atonement
```

## Key Insights

### Centrality of Salvation
The **salvation** folder is the most connected hub, receiving links from:
- **freewill** (9) - How God saves (election, grace, perseverance)
- **baptism** (8) - The means of entering salvation
- Linking out to **jesus** (3) and **man** (3)

This reflects salvation as the central organizing doctrine that ties together:
- God's sovereignty (freewill debates)
- The means of grace (baptism, sacraments)
- Christ's work (atonement, resurrection)
- Human nature (fall, redemption)

### The God-Jesus Connection
The bidirectional connection between **god** and **jesus** folders (4 links each way) demonstrates the core Christological tension:
- Who is Jesus in relation to God? (Christology)
- How does the incarnation affect our understanding of God? (Theology proper)

This is the heart of Trinitarian theology - you cannot fully understand one without the other.

### Baptism as Theological Nexus
**Baptism** connects to multiple domains:
- **salvation** (8) - Is it necessary? Does it convey grace?
- **church** (4) - Who is baptized? What does baptism signify about the church?
- **god** (2) - Sacramental theology and divine sovereignty

This makes baptism one of the most divisive practices in Christianity - it touches ecclesiology, soteriology, sacramental theology, and covenant theology simultaneously.

### Freewill's Reach
**Freewill** has the broadest cross-category impact (16 total links):
- **salvation** (9) - Election, grace, perseverance
- **man** (3) - Human agency, the fall
- **god** (2) - Divine sovereignty
- **jesus** (2) - Atonement and predestination

The sovereignty-freedom tension affects nearly every theological domain.

### Bible's Isolation
**Bible** has ZERO outbound cross-category links. This is intentional - bibliology focuses on Scripture itself (inspiration, inerrancy, interpretation) without importing debates from other domains.

---
# See Also

**Site Navigation:**
- [About](#site/about 'Parent') - Project overview and design rationale
- [Table of Contents](#TOC 'Drill') - All major theological categories

**Explore the Lattice:**
- Start anywhere and follow the links - the structure emerges through exploration
- Notice how concepts appear in multiple contexts with different emphases
- The Hebrew-Greek tension is the lens, not the hierarchy
