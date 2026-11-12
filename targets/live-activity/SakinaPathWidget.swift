// The square Home Screen widget, "Your path" (spec: docs/superpowers/specs/
// 2026-11-11-square-widget-design.md). Pro only; it walks the user through
// Sakina's own day (check-in, Journey, reflection) and never repeats what the
// prayer card shows.
//
// The app writes a finished 30-day timeline into the App Group
// (WidgetSnapshotStore) and reloads this widget after every write. The
// provider only turns that list into WidgetKit entries; entries planned ahead
// do not spend the widget's refresh budget.

import SwiftUI
import WidgetKit

struct PathEntry: TimelineEntry {
  let date: Date
  let state: PathWidgetState
}

struct PathProvider: TimelineProvider {
  func placeholder(in context: Context) -> PathEntry {
    PathEntry(date: Date(), state: WidgetSnapshotStore.sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (PathEntry) -> Void) {
    if context.isPreview {
      completion(PathEntry(date: Date(), state: WidgetSnapshotStore.sample))
      return
    }
    let now = Date()
    let state = WidgetSnapshotStore.upcoming(from: now).first?.state ?? WidgetSnapshotStore.locked
    completion(PathEntry(date: now, state: state))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PathEntry>) -> Void) {
    let entries = WidgetSnapshotStore.upcoming(from: Date()).map { PathEntry(date: $0.date, state: $0.state) }
    // A single entry (locked, or nothing written yet) waits for the app's next
    // write, which reloads this widget; a timeline asks again after its last day.
    let policy: TimelineReloadPolicy = entries.count > 1 ? .atEnd : .never
    completion(Timeline(entries: entries, policy: policy))
  }
}

struct SakinaPathWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "SakinaPathWidget", provider: PathProvider()) { entry in
      PathWidgetView(state: entry.state)
    }
    .configurationDisplayName("Sakina")
    .description("Your day with Sakina: check-in, Journey and reflection.")
    .supportedFamilies([.systemSmall])
    .contentMarginsDisabled()
  }
}
