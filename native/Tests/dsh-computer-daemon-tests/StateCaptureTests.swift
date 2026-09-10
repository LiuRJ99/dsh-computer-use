import XCTest
@testable import dsh_computer_daemon

/** Pure-logic tests: role/action vocabulary and the Codex-style diff format. No AX, screen, or input APIs run here. */
final class StateCaptureTests: XCTestCase {

    private func line(_ key: String, _ text: String) -> CaptureSession.DiffLine {
        CaptureSession.DiffLine(key: key, text: text)
    }

    func testHumanActionLabelMapsAXNamesToDisplayLabels() {
        XCTAssertEqual(CaptureSession.humanActionLabel("AXRaise"), "Raise")
        XCTAssertEqual(CaptureSession.humanActionLabel("AXScrollLeftByPage"), "Scroll Left By Page")
        XCTAssertEqual(CaptureSession.humanActionLabel("AXShowMenu"), "Show Menu")
        XCTAssertEqual(CaptureSession.humanActionLabel("Raise"), "Raise")
    }

    func testSpacedRoleFallsBackToLowercasedWords() {
        XCTAssertEqual(CaptureSession.spacedRole("AXFooBar"), "foo bar")
        XCTAssertEqual(CaptureSession.spacedRole("AXWindow"), "window")
        XCTAssertEqual(CaptureSession.spacedRole("Plain"), "plain")
    }

    func testDiffMarksAddedChangedAndSummarizesRemovedElements() {
        let previous = [
            line("0", "0 standard window"),
            line("0/0", "\t1 button"),
            line("0/1", "\t2 label"),
            line("0/2", "\t3 checkbox"),
            line("focus", "The focused UI element is 1 button"),
        ]
        let current = [
            line("0", "0 standard window"),
            line("0/0", "\t1 button renamed"),
            line("0/2", "\t3 checkbox"),
            line("0/3", "\t4 radio"),
            line("focus", "The focused UI element is 2 text entry area"),
        ]
        let header = "App=com.example.app (pid 1)\nWindow: \"x\", App: Example."
        let diff = CaptureSession.diffText(header: header, current: current, previous: previous)
        XCTAssertTrue(diff.hasPrefix(header + "\nThe following is a diff from the previous accessibility tree"))
        XCTAssertTrue(diff.contains("~ \t1 button renamed"))
        XCTAssertTrue(diff.contains("+ \t4 radio"))
        XCTAssertTrue(diff.contains("~ The focused UI element is 2 text entry area"))
        XCTAssertTrue(diff.contains("Removed element IDs: 2"))
        XCTAssertFalse(diff.contains("- "))
    }

    func testDiffWithNoChangesReportsTheUnchangedSentence() {
        let lines = [line("0", "0 standard window")]
        let header = "App=com.example.app (pid 1)"
        let diff = CaptureSession.diffText(header: header, current: lines, previous: lines)
        XCTAssertEqual(diff, header + "\nThere has been no change in the accessibility tree for the previous capture.")
    }

    func testCumulativeDiffAnnouncesItsOwnHeader() {
        let initial = [
            line("0", "0 standard window"),
            line("0/0", "\t1 button"),
            line("0/1", "\t2 label"),
        ]
        let current = [
            line("0", "0 standard window"),
            line("0/0", "\t1 button renamed"),
            line("0/2", "\t3 checkbox"),
        ]
        let header = "App=com.example.app (pid 1)"
        let diff = CaptureSession.cumulativeDiffText(header: header, current: current, initial: initial)
        XCTAssertTrue(diff.hasPrefix(header + "\nThe following is a cumulative diff from the initial accessibility tree"))
        XCTAssertTrue(diff.contains("~ \t1 button renamed"))
        XCTAssertTrue(diff.contains("+ \t3 checkbox"))
        XCTAssertTrue(diff.contains("Removed element IDs: 2"))
    }

    func testLeadingIndexParsesTreeLinesAndRejectsOthers() {
        XCTAssertEqual(CaptureSession.leadingIndex(of: "0 standard window"), 0)
        XCTAssertEqual(CaptureSession.leadingIndex(of: "\t14 text field"), 14)
        XCTAssertNil(CaptureSession.leadingIndex(of: "The focused UI element is 2 text entry area"))
        XCTAssertNil(CaptureSession.leadingIndex(of: "... (element limit reached; the tree is incomplete)"))
        XCTAssertNil(CaptureSession.leadingIndex(of: "12"))
    }

    func testSummarizeRangesCompressesConsecutiveIds() {
        XCTAssertEqual(CaptureSession.summarizeRanges([2]), "2")
        XCTAssertEqual(CaptureSession.summarizeRanges([3, 4, 5, 8]), "3–5, 8")
        XCTAssertEqual(CaptureSession.summarizeRanges([7, 2, 4, 3]), "2–4, 7")
        XCTAssertEqual(CaptureSession.summarizeRanges([]), "")
    }

    func testSettleWaitHelpersComputeTheGateAndBaseDelay() {
        XCTAssertTrue(CaptureSession.needsSettleWait(now: 10.0, lastAction: 9.0))
        XCTAssertFalse(CaptureSession.needsSettleWait(now: 10.0, lastAction: 7.0))
        XCTAssertEqual(CaptureSession.settleBaseRemaining(now: 9.2, lastAction: 9.0), 0.8, accuracy: 0.0001)
        XCTAssertEqual(CaptureSession.settleBaseRemaining(now: 11.0, lastAction: 9.0), 0)
    }

    func testCaptureWindowIdFallsBackToCoreGraphicsAndPrefersExactTitle() {
        let owner = kCGWindowOwnerPID as String
        let number = kCGWindowNumber as String
        let layer = kCGWindowLayer as String
        let name = kCGWindowName as String
        let infos: [[String: Any]] = [
            [owner: NSNumber(value: 4242), number: NSNumber(value: 11), layer: NSNumber(value: 0), name: "Other"],
            [owner: NSNumber(value: 4242), number: NSNumber(value: 88), layer: NSNumber(value: 0), name: "WorkBuddy"],
            [owner: NSNumber(value: 4242), number: NSNumber(value: 77), layer: NSNumber(value: 1), name: "Overlay"],
            [owner: NSNumber(value: 7), number: NSNumber(value: 99), layer: NSNumber(value: 0), name: "WorkBuddy"],
        ]
        let selected = CaptureSession.selectCaptureWindowId(infos: infos, pid: 4242, title: "WorkBuddy")
        XCTAssertEqual(selected.id, 88)
        XCTAssertEqual(selected.candidateCount, 2)
        let fallback = CaptureSession.selectCaptureWindowId(infos: infos, pid: 4242, title: nil)
        XCTAssertEqual(fallback.id, 11)
        XCTAssertEqual(fallback.candidateCount, 2)
    }
}
