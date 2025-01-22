import React, { useState } from 'react';
import { TextField, Button, CircularProgress, Typography } from '@mui/material';
import TemplateSelector from './TemplateSelector';

const ArticleForm = ({ 
  formik, 
  loading, 
  handleImageChange, 
  imagePreview, 
  generatedContent,
  templateName,
  setTemplateName,
  hasGeneratedContent,
  setHasGeneratedContent 
}) => {
  console.log('ArticleForm rendering');
  const [lineupsOpen, setLineupsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  return (
    <div className="p-6">
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="mb-8">
          <Typography variant="h6" gutterBottom>
            Choose a Template
          </Typography>
          <TemplateSelector
            selectedTemplate={formik.values.template_name}
            onSelect={(templateId) => formik.setFieldValue('template_name', templateId)}
          />
        </div>

        {formik.values.template_name === 'ss_player_scout_report_template.html' && (
          <>
            <TextField
              fullWidth
              id="player_name"
              name="player_name"
              label="Player Name"
              value={formik.values.player_name}
              onChange={formik.handleChange}
              error={formik.touched.player_name && Boolean(formik.errors.player_name)}
              helperText={formik.touched.player_name && formik.errors.player_name}
              className="mb-4"
            />

            <TextField
              fullWidth
              id="player_position"
              name="player_position"
              label="Player Position(s)"
              value={formik.values.player_position}
              onChange={formik.handleChange}
              className="mb-4"
              placeholder="e.g., Forward, Striker, Attacking Mid, etc."
            />

            <div className="grid grid-cols-3 gap-4 mb-6">
              <TextField
                fullWidth
                id="player_age"
                name="player_age"
                label="Age"
                value={formik.values.player_age}
                onChange={formik.handleChange}
                className="mb-4"
              />
              <TextField
                fullWidth
                id="player_nationality"
                name="player_nationality"
                label="Nationality"
                value={formik.values.player_nationality}
                onChange={formik.handleChange}
                className="mb-4"
              />
              <TextField
                fullWidth
                id="favored_foot"
                name="favored_foot"
                label="Favoured Foot"
                value={formik.values.favored_foot}
                onChange={formik.handleChange}
                className="mb-4"
              />
            </div>

            <TextField
              fullWidth
              multiline
              rows={6}
              id="scout_stats"
              name="scout_stats"
              label="Player Stats or Performance Data"
              value={formik.values.scout_stats}
              onChange={formik.handleChange}
              helperText="Provide any stats or relevant data: e.g. goals, assists, xG, passing %, etc."
              placeholder={`Goals: 7, Assists: 4, xG: 5.2, Dribbles Completed: 42...
        Tackle Success: 60%, Progressive Carries: 80...`}
            />
          </>
        )}

        {(formik.values.template_name === 'match_report_template.html' || formik.values.template_name === 'ss_match_report_template.html') ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <TextField
                fullWidth
                id="competition"
                name="competition"
                label="Competition"
                value={formik.values.competition}
                onChange={formik.handleChange}
                className="mb-4"
              />
              <TextField
                fullWidth
                id="venue"
                name="venue"
                label="Venue"
                value={formik.values.venue}
                onChange={formik.handleChange}
                className="mb-4"
              />
              <TextField
                fullWidth
                id="match_date"
                name="match_date"
                label="Match Date"
                type="date"
                value={formik.values.match_date}
                onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
                className="mb-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <TextField
                fullWidth
                id="home_team"
                name="home_team"
                label="Home Team"
                value={formik.values.home_team}
                onChange={formik.handleChange}
                error={formik.touched.home_team && Boolean(formik.errors.home_team)}
                helperText={formik.touched.home_team && formik.errors.home_team}
              />
              <TextField
                fullWidth
                id="away_team"
                name="away_team"
                label="Away Team"
                value={formik.values.away_team}
                onChange={formik.handleChange}
                error={formik.touched.away_team && Boolean(formik.errors.away_team)}
                helperText={formik.touched.away_team && formik.errors.away_team}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <TextField
                fullWidth
                type="number"
                id="home_score"
                name="home_score"
                label="Home Score"
                value={formik.values.home_score}
                onChange={formik.handleChange}
                inputProps={{ min: 0 }}
                error={formik.touched.home_score && Boolean(formik.errors.home_score)}
                helperText={formik.touched.home_score && formik.errors.home_score}
              />
              <TextField
                fullWidth
                type="number"
                id="away_score"
                name="away_score"
                label="Away Score"
                value={formik.values.away_score}
                onChange={formik.handleChange}
                inputProps={{ min: 0 }}
                error={formik.touched.away_score && Boolean(formik.errors.away_score)}
                helperText={formik.touched.away_score && formik.errors.away_score}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <TextField
                fullWidth
                multiline
                rows={2}
                id="home_scorers"
                name="home_scorers"
                label={`${formik.values.home_team || 'Home'} Scorers`}
                value={formik.values.home_scorers}
                onChange={formik.handleChange}
                error={formik.touched.home_scorers && Boolean(formik.errors.home_scorers)}
                helperText={
                  (formik.touched.home_scorers && formik.errors.home_scorers) ||
                  "Format: Player Name (time')"
                }
                placeholder="Example: Rashford (23'), Bruno (45+2'), Martial (67')"
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                id="away_scorers"
                name="away_scorers"
                label={`${formik.values.away_team || 'Away'} Scorers`}
                value={formik.values.away_scorers}
                onChange={formik.handleChange}
                error={formik.touched.away_scorers && Boolean(formik.errors.away_scorers)}
                helperText={
                  (formik.touched.away_scorers && formik.errors.away_scorers) ||
                  "Format: Player Name (time')"
                }
                placeholder="Example: Salah (15'), Núñez (78')"
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                id="key_events"
                name="key_events"
                label="Key Events"
                value={formik.values.key_events}
                onChange={formik.handleChange}
                helperText="Add major incidents (penalties, red cards, pivotal goals, etc.)"
              />

            </div>

            <div className="mt-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLineupsOpen(!lineupsOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">👥</span>
                    <span className="font-medium">Team Lineups</span>
                  </div>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${lineupsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className={`${lineupsOpen ? 'block' : 'hidden'} p-6 bg-white`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <TextField
                      fullWidth
                      multiline
                      rows={11}
                      id="home_lineup"
                      name="home_lineup"
                      label={`${formik.values.home_team || 'Home'} Lineup`}
                      value={formik.values.home_lineup}
                      onChange={formik.handleChange}
                      error={formik.touched.home_lineup && Boolean(formik.errors.home_lineup)}
                      helperText={
                        (formik.touched.home_lineup && formik.errors.home_lineup) ||
                        "Format: (number) Player Name\nOne player per line"
                      }
                      placeholder={`Example:\n(1) De Gea\n(5) Maguire\n(18) Bruno Fernandes`}
                      InputProps={{
                        style: { fontFamily: 'monospace' }
                      }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={11}
                      id="away_lineup"
                      name="away_lineup"
                      label={`${formik.values.away_team || 'Away'} Lineup`}
                      value={formik.values.away_lineup}
                      onChange={formik.handleChange}
                      error={formik.touched.away_lineup && Boolean(formik.errors.away_lineup)}
                      helperText={
                        (formik.touched.away_lineup && formik.errors.away_lineup) ||
                        "Format: (number) Player Name\nOne player per line"
                      }
                      placeholder={`Example:\n(1) Alisson\n(4) Van Dijk\n(11) Salah`}
                      InputProps={{
                        style: { fontFamily: 'monospace' }
                      }}
                    />
                  </div>

                  <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>
                        Enter each player on a new line using the format: (number) Player Name<br/>
                        Example: (7) Cristiano Ronaldo<br/>
                        Use accents and special characters as needed: (9) Núñez
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setStatsOpen(!statsOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📊</span>
                    <span className="font-medium">Match Statistics</span>
                  </div>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${statsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className={`${statsOpen ? 'block' : 'hidden'} p-6 bg-white`}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TextField
                      fullWidth
                      type="number"
                      id="home_xg"
                      name="home_xg"
                      label="Home xG"
                      value={formik.values.home_xg}
                      onChange={formik.handleChange}
                      inputProps={{
                        step: "0.1",
                        min: "0",
                        max: "10"
                      }}
                      error={formik.touched.home_xg && Boolean(formik.errors.home_xg)}
                      helperText="Expected Goals"
                    />
                    <TextField
                      fullWidth
                      type="number"
                      id="away_xg"
                      name="away_xg"
                      label="Away xG"
                      value={formik.values.away_xg}
                      onChange={formik.handleChange}
                      inputProps={{
                        step: "0.1",
                        min: "0",
                        max: "10"
                      }}
                      error={formik.touched.away_xg && Boolean(formik.errors.away_xg)}
                      helperText="Expected Goals"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TextField
                      fullWidth
                      type="number"
                      id="home_possession"
                      name="home_possession"
                      label="Home Possession %"
                      value={formik.values.home_possession}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0, max: 100 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      id="away_possession"
                      name="away_possession"
                      label="Away Possession %"
                      value={formik.values.away_possession}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TextField
                      fullWidth
                      type="number"
                      id="home_shots"
                      name="home_shots"
                      label="Home Shots"
                      value={formik.values.home_shots}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      id="away_shots"
                      name="away_shots"
                      label="Away Shots"
                      value={formik.values.away_shots}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TextField
                      fullWidth
                      type="number"
                      id="home_shots_on_target"
                      name="home_shots_on_target"
                      label="Home Shots on Target"
                      value={formik.values.home_shots_on_target}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      id="away_shots_on_target"
                      name="away_shots_on_target"
                      label="Away Shots on Target"
                      value={formik.values.away_shots_on_target}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TextField
                      fullWidth
                      type="number"
                      id="home_corners"
                      name="home_corners"
                      label="Home Corners"
                      value={formik.values.home_corners}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      id="away_corners"
                      name="away_corners"
                      label="Away Corners"
                      value={formik.values.away_corners}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TextField
                      fullWidth
                      type="number"
                      id="home_fouls"
                      name="home_fouls"
                      label="Home Fouls"
                      value={formik.values.home_fouls}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      id="away_fouls"
                      name="away_fouls"
                      label="Away Fouls"
                      value={formik.values.away_fouls}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TextField
                      fullWidth
                      type="number"
                      id="home_yellow_cards"
                      name="home_yellow_cards"
                      label="Home Yellow Cards"
                      value={formik.values.home_yellow_cards}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      id="away_yellow_cards"
                      name="away_yellow_cards"
                      label="Away Yellow Cards"
                      value={formik.values.away_yellow_cards}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TextField
                      fullWidth
                      type="number"
                      id="home_red_cards"
                      name="home_red_cards"
                      label="Home Red Cards"
                      value={formik.values.home_red_cards}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      id="away_red_cards"
                      name="away_red_cards"
                      label="Away Red Cards"
                      value={formik.values.away_red_cards}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TextField
                      fullWidth
                      type="number"
                      id="home_offsides"
                      name="home_offsides"
                      label="Home Offsides"
                      value={formik.values.home_offsides}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      id="away_offsides"
                      name="away_offsides"
                      label="Away Offsides"
                      value={formik.values.away_offsides}
                      onChange={formik.handleChange}
                      inputProps={{ min: 0 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <TextField
          fullWidth
          id="publisher_name"
          name="publisher_name"
          label="Publisher Name"
          value={formik.values.publisher_name}
          onChange={formik.handleChange}
          error={formik.touched.publisher_name && Boolean(formik.errors.publisher_name)}
          helperText={formik.touched.publisher_name && formik.errors.publisher_name}
        />

        <TextField
          fullWidth
          id="publisher_url"
          name="publisher_url"
          label="Publisher URL"
          value={formik.values.publisher_url}
          onChange={formik.handleChange}
          error={formik.touched.publisher_url && Boolean(formik.errors.publisher_url)}
          helperText={formik.touched.publisher_url && formik.errors.publisher_url}
        />

        <TextField
          fullWidth
          id="topic"
          name="topic"
          label="Topic"
          value={formik.values.topic}
          onChange={formik.handleChange}
          error={formik.touched.topic && Boolean(formik.errors.topic)}
          helperText={formik.touched.topic && formik.errors.topic}
        />

        <TextField
          fullWidth
          id="keywords"
          name="keywords"
          label="Keywords"
          value={formik.values.keywords}
          onChange={formik.handleChange}
          error={formik.touched.keywords && Boolean(formik.errors.keywords)}
          helperText={formik.touched.keywords && formik.errors.keywords}
        />

        <TextField
          fullWidth
          multiline
          rows={4}
          id="context"
          name="context"
          label="Additional Context"
          value={formik.values.context}
          onChange={formik.handleChange}
          error={formik.touched.context && Boolean(formik.errors.context)}
          helperText={formik.touched.context && formik.errors.context}
        />

        <TextField
          fullWidth
          multiline
          rows={4}
          id="supporting_data"
          name="supporting_data"
          label="Supporting Data"
          value={formik.values.supporting_data}
          onChange={formik.handleChange}
          error={formik.touched.supporting_data && Boolean(formik.errors.supporting_data)}
          helperText={
            formik.values.template_name === 'match_report_template.html' ?
            `Provide relevant context such as:
             • Current league positions
             • Recent form (e.g., "United: WWDLW, Liverpool: DWWLD")
             • Head-to-head record
             • Key player availability/injuries
             • Historical context of the fixture
             • Any significant milestones or records`
            : 'Add any supporting data or context'
          }
          placeholder={
            formik.values.template_name === 'match_report_template.html' ?
            `Example:
United sit 3rd in the table, having won their last three home games.
Liverpool arrive in 5th place, unbeaten in their last 5 away matches.
United's last 5: WWDLW
Liverpool's last 5: DWWLD
Previous meeting: Liverpool 2-1 United (Sep 2023)
Key absences: Shaw (United, injured), Van Dijk (Liverpool, suspended)`
            : ''
          }
        />

        <TextField
          fullWidth
          id="image_url"
          name="image_url"
          label="Featured Image URL"
          value={formik.values.image_url}
          onChange={formik.handleChange}
          error={formik.touched.image_url && Boolean(formik.errors.image_url)}
          helperText={
            (formik.touched.image_url && formik.errors.image_url) ||
            "Enter the URL of the featured image"
          }
          placeholder="https://example.com/image.jpg"
        />

        {formik.values.image_url && (
          <div className="mt-2">
            <img
              src={formik.values.image_url}
              alt="Preview"
              className="max-h-40 object-contain"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          className="mt-4"
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Article'}
        </Button>
      </form>
    </div>
  );
}

export default ArticleForm;